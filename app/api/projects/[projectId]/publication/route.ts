import { NextResponse } from "next/server";
import { z } from "zod";

import { parseWebsiteConfigInput } from "@/lib/ai/website-config-schema";
import { collectStorageMediaPaths, parseProjectMediaPath } from "@/lib/media/storage-media";
import { createPublishedWebsiteConfig, hashWebsiteConfig } from "@/lib/publishing/config";
import { normalizePublicSlug, publicSlugCandidate } from "@/lib/publishing/slug";
import { prepareWebsiteConfigForPersistence } from "@/lib/projects/persistence";
import { getOwnedProject } from "@/lib/projects/server";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/supabase";

const actionSchema = z.object({ action: z.enum(["publish", "unpublish"]) }).strict();

function errorResponse(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

function safeErrorField(error: unknown, field: string): unknown {
  if (!error || (typeof error !== "object" && typeof error !== "function")) return undefined;
  try {
    return field in error ? (error as Record<string, unknown>)[field] : undefined;
  } catch {
    return undefined;
  }
}

function sanitizedDatabaseDiagnostic(value: unknown): string | number | undefined {
  if (typeof value === "number") return value;
  if (typeof value !== "string" || value.length === 0) return undefined;
  return value
    .slice(0, 1000)
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[REDACTED_EMAIL]")
    .replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, "[REDACTED_TOKEN]")
    .replace(/sb_(?:publishable|secret)_[A-Za-z0-9_-]+/g, "[REDACTED_SUPABASE_KEY]")
    .replace(/(authorization|apikey)(\s*[:=]\s*)[^\s,}]+/gi, "$1$2[REDACTED]");
}

function logPublicationFailure(error: unknown, projectId: string) {
  const constructorName = error && typeof error === "object" ? error.constructor?.name : undefined;
  console.error("[publication:publish] snapshot failed", JSON.stringify({
    operation: "publish_snapshot",
    name: sanitizedDatabaseDiagnostic(safeErrorField(error, "name")) ?? constructorName ?? typeof error,
    code: sanitizedDatabaseDiagnostic(safeErrorField(error, "code")),
    message: sanitizedDatabaseDiagnostic(safeErrorField(error, "message") ?? (typeof error === "string" ? error : undefined)),
    details: sanitizedDatabaseDiagnostic(safeErrorField(error, "details")),
    hint: sanitizedDatabaseDiagnostic(safeErrorField(error, "hint")),
    projectId,
  }));
}

export async function POST(request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const owned = await getOwnedProject(projectId);
  if (!owned.ok) return errorResponse(owned.status, owned.code, owned.message);

  const body = actionSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return errorResponse(400, "invalid_action", "Choose a valid publishing action.");
  const supabase = await createClient();

  if (body.data.action === "unpublish") {
    const { data, error } = await supabase
      .from("published_sites")
      .update({ is_active: false })
      .eq("project_id", projectId)
      .eq("user_id", owned.project.user_id)
      .select("public_slug, config_hash, published_at")
      .maybeSingle();
    if (error) {
      console.error("[publication:unpublish] update failed", { code: error.code, projectId });
      return errorResponse(503, "unpublish_failed", "The site could not be unpublished. Please try again.");
    }
    if (!data) return errorResponse(404, "publication_not_found", "This project has not been published.");
    return NextResponse.json({ publicSlug: data.public_slug, publicUrl: `/site/${data.public_slug}`, isActive: false, configHash: data.config_hash, publishedAt: data.published_at });
  }

  if (!owned.project.website_config) return errorResponse(409, "site_not_ready", "Create and save a website before publishing.");
  try {
    const parsed = parseWebsiteConfigInput(owned.project.website_config);
    const draft = prepareWebsiteConfigForPersistence(parsed).config;
    const storagePaths = [...collectStorageMediaPaths(draft)];
    if (storagePaths.some((path) => parseProjectMediaPath(path)?.projectId !== projectId || parseProjectMediaPath(path)?.userId !== owned.project.user_id)) {
      return errorResponse(400, "invalid_media", "One or more images do not belong to this project.");
    }
    const configHash = await hashWebsiteConfig(draft);
    const { data: existing, error: existingError } = await supabase
      .from("published_sites")
      .select("public_slug")
      .eq("project_id", projectId)
      .eq("user_id", owned.project.user_id)
      .maybeSingle();
    if (existingError) throw existingError;

    const slugBase = normalizePublicSlug(draft.business.name || owned.project.name, projectId);
    for (let suffix = 1; suffix <= 9999; suffix += 1) {
      const slug = existing?.public_slug ?? publicSlugCandidate(slugBase, suffix);
      const publishedConfig = createPublishedWebsiteConfig(draft, slug);
      const { data, error } = await supabase.rpc("publish_project", {
        p_project_id: projectId,
        p_public_slug_base: slug,
        p_published_config: publishedConfig as unknown as Json,
        p_config_hash: configHash,
        p_storage_paths: storagePaths,
      });
      if (error?.code === "23505" && !existing) continue;
      if (error) throw error;
      const publication = data?.[0];
      if (!publication) throw new Error("Publishing returned no result.");
      return NextResponse.json({ publicSlug: publication.public_slug, publicUrl: `/site/${publication.public_slug}`, isActive: true, configHash, publishedAt: publication.published_at });
    }
    return errorResponse(409, "slug_unavailable", "A public address could not be reserved. Please try again.");
  } catch (error: unknown) {
    logPublicationFailure(error, projectId);
    return errorResponse(503, "publishing_failed", "Publishing failed. Your draft is unchanged; please try again.");
  }
}
