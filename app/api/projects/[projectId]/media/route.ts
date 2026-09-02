import { z } from "zod";

import { parseWebsiteConfigInput } from "@/lib/ai/website-config-schema";
import { ImageValidationError, validatePersistentImage } from "@/lib/media/image-validation";
import { collectStorageMediaPaths, createProjectMediaUrl, parseProjectMediaPath, SITE_MEDIA_BUCKET } from "@/lib/media/storage-media";
import { getOwnedProject } from "@/lib/projects/server";
import { createClient } from "@/lib/supabase/server";
import type { WebsiteImageFit } from "@/types/website";

export const runtime = "nodejs";

const MAX_UPLOAD_REQUEST_BYTES = 11 * 1024 * 1024;
const altSchema = z.string().trim().min(1).max(500);
const fitSchema = z.enum(["cover", "contain"]);
const deleteSchema = z.object({ storagePath: z.string().min(1).max(300) }).strict();

function errorResponse(status: number, code: string, message: string) {
  return Response.json({ error: { code, message } }, { status, headers: { "Cache-Control": "no-store" } });
}

function safeErrorField(error: unknown, field: string): unknown {
  if (!error || (typeof error !== "object" && typeof error !== "function")) return undefined;
  try {
    return field in error ? (error as Record<string, unknown>)[field] : undefined;
  } catch {
    return undefined;
  }
}

function sanitizedStorageDiagnostic(value: unknown): string | number | undefined {
  if (typeof value === "number") return value;
  if (typeof value !== "string" || value.length === 0) return undefined;
  return value
    .slice(0, 1000)
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[REDACTED_EMAIL]")
    .replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, "[REDACTED_TOKEN]")
    .replace(/sb_(?:publishable|secret)_[A-Za-z0-9_-]+/g, "[REDACTED_SUPABASE_KEY]")
    .replace(/(authorization|apikey)(\s*[:=]\s*)[^\s,}]+/gi, "$1$2[REDACTED]");
}

function logStorageFailure(error: unknown, operation: string, projectId: string) {
  const constructorName = error && typeof error === "object" ? error.constructor?.name : undefined;
  console.error(`[project-media:${operation}] storage operation failed`, JSON.stringify({
    operation,
    bucket: SITE_MEDIA_BUCKET,
    name: sanitizedStorageDiagnostic(safeErrorField(error, "name")) ?? constructorName ?? typeof error,
    code: sanitizedStorageDiagnostic(safeErrorField(error, "code")),
    status: sanitizedStorageDiagnostic(safeErrorField(error, "status") ?? safeErrorField(error, "statusCode")),
    message: sanitizedStorageDiagnostic(safeErrorField(error, "message") ?? (typeof error === "string" ? error : undefined)),
    projectId,
  }));
}

function pathBelongsToProject(path: string, userId: string, projectId: string) {
  const parsed = parseProjectMediaPath(path);
  return parsed && parsed.userId === userId.toLowerCase() && parsed.projectId === projectId.toLowerCase();
}

export async function POST(request: Request, context: { params: Promise<{ projectId: string }> }) {
  if (Number(request.headers.get("content-length") ?? 0) > MAX_UPLOAD_REQUEST_BYTES) {
    return errorResponse(413, "image_too_large", "Images must be 10 MB or smaller.");
  }
  const { projectId } = await context.params;
  const ownership = await getOwnedProject(projectId);
  if (!ownership.ok) return errorResponse(ownership.status, ownership.code, ownership.message);

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return errorResponse(400, "invalid_upload", "The image upload could not be read.");
  }
  const file = formData.get("file");
  const alt = altSchema.safeParse(formData.get("alt"));
  const fit = fitSchema.safeParse(formData.get("fit") ?? "cover");
  if (!(file instanceof File) || !alt.success || !fit.success) {
    return errorResponse(422, "invalid_upload", "Choose a valid image and provide useful alt text.");
  }

  try {
    const image = await validatePersistentImage(file);
    const assetId = crypto.randomUUID();
    const storagePath = `${ownership.project.user_id}/${ownership.project.id}/${assetId}.${image.extension}`;
    const supabase = await createClient();
    const { error } = await supabase.storage.from(SITE_MEDIA_BUCKET).upload(storagePath, image.bytes, {
      cacheControl: "3600",
      contentType: image.mimeType,
      upsert: false,
    });
    if (error) {
      logStorageFailure(error, "upload", projectId);
      return errorResponse(503, "upload_unavailable", "The image could not be uploaded right now.");
    }
    return Response.json({
      media: {
        kind: "image",
        src: createProjectMediaUrl(projectId, storagePath),
        alt: alt.data,
        source: "storage",
        storagePath,
        mimeType: image.mimeType,
        width: image.width,
        height: image.height,
        fit: fit.data as WebsiteImageFit,
      },
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error: unknown) {
    if (error instanceof ImageValidationError) return errorResponse(422, "invalid_image", error.message);
    logStorageFailure(error, "upload", projectId);
    return errorResponse(500, "upload_failed", "The image could not be uploaded.");
  }
}

export async function GET(request: Request, context: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await context.params;
  const ownership = await getOwnedProject(projectId);
  if (!ownership.ok) return errorResponse(ownership.status, ownership.code, ownership.message);
  const storagePath = new URL(request.url).searchParams.get("path") ?? "";
  if (!pathBelongsToProject(storagePath, ownership.project.user_id, ownership.project.id)) {
    return errorResponse(404, "media_not_found", "The image was not found.");
  }
  const supabase = await createClient();
  const { data, error } = await supabase.storage.from(SITE_MEDIA_BUCKET).download(storagePath);
  if (error || !data) return errorResponse(404, "media_not_found", "The image was not found.");
  return new Response(data.stream(), {
    headers: {
      "Cache-Control": "private, max-age=3600",
      "Content-Type": data.type || "application/octet-stream",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function DELETE(request: Request, context: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await context.params;
  const ownership = await getOwnedProject(projectId);
  if (!ownership.ok) return errorResponse(ownership.status, ownership.code, ownership.message);
  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return errorResponse(400, "invalid_json", "The media cleanup request is invalid.");
  }
  const parsed = deleteSchema.safeParse(input);
  if (!parsed.success || !pathBelongsToProject(parsed.data.storagePath, ownership.project.user_id, ownership.project.id)) {
    return errorResponse(404, "media_not_found", "The image was not found.");
  }
  if (ownership.project.website_config) {
    try {
      const savedConfig = parseWebsiteConfigInput(ownership.project.website_config);
      if (collectStorageMediaPaths(savedConfig).has(parsed.data.storagePath)) {
        return errorResponse(409, "media_still_in_use", "The image is still used by the saved website.");
      }
    } catch {
      return errorResponse(409, "project_state_invalid", "The saved website could not be verified for media cleanup.");
    }
  }
  const supabase = await createClient();
  const { data: publishedAsset, error: publicationLookupError } = await supabase
    .from("published_site_assets")
    .select("project_id")
    .eq("project_id", projectId)
    .eq("storage_path", parsed.data.storagePath)
    .maybeSingle();
  if (publicationLookupError) {
    console.error("[project-media:delete] publication lookup failed", { code: publicationLookupError.code, projectId });
    return errorResponse(503, "delete_unavailable", "The image could not be removed safely right now.");
  }
  if (publishedAsset) {
    const { data: activePublication, error: activePublicationError } = await supabase
      .from("published_sites")
      .select("project_id")
      .eq("project_id", projectId)
      .eq("is_active", true)
      .maybeSingle();
    if (activePublicationError) {
      console.error("[project-media:delete] publication status lookup failed", { code: activePublicationError.code, projectId });
      return errorResponse(503, "delete_unavailable", "The image could not be removed safely right now.");
    }
    if (activePublication) return errorResponse(409, "media_published", "The image is still used by the published website.");
  }
  const { error } = await supabase.storage.from(SITE_MEDIA_BUCKET).remove([parsed.data.storagePath]);
  if (error) {
    console.error("[project-media:delete] storage removal failed", { code: error.name, projectId });
    return errorResponse(503, "delete_unavailable", "The image could not be removed right now.");
  }
  return new Response(null, { status: 204 });
}
