import { z } from "zod";

import { parseWebsiteConfigInput } from "@/lib/ai/website-config-schema";
import { getOwnedProject } from "@/lib/projects/server";
import { prepareWebsiteConfigForPersistence } from "@/lib/projects/persistence";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/supabase";

export const runtime = "nodejs";

const MAX_REQUEST_BYTES = 200_000;
const stateSchema = z.object({
  name: z.string().trim().min(1).max(80),
  currentPageId: z.string().trim().min(1).max(64),
  websiteConfig: z.unknown(),
}).strict();

function errorResponse(status: number, code: string, message: string) {
  return Response.json({ error: { code, message } }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function PATCH(request: Request, context: { params: Promise<{ projectId: string }> }) {
  if (Number(request.headers.get("content-length") ?? 0) > MAX_REQUEST_BYTES) {
    return errorResponse(413, "request_too_large", "The project is too large to save.");
  }
  const { projectId } = await context.params;
  const ownership = await getOwnedProject(projectId);
  if (!ownership.ok) return errorResponse(ownership.status, ownership.code, ownership.message);

  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return errorResponse(400, "invalid_json", "The project update is invalid.");
  }
  const parsed = stateSchema.safeParse(input);
  if (!parsed.success) return errorResponse(422, "invalid_project_state", "The project update could not be validated.");

  let durable;
  try {
    const validatedConfig = parseWebsiteConfigInput(parsed.data.websiteConfig);
    durable = prepareWebsiteConfigForPersistence(validatedConfig);
  } catch {
    return errorResponse(422, "invalid_website_config", "The website configuration is invalid and was not saved.");
  }
  if (!durable.config.pages.some((page) => page.id === parsed.data.currentPageId && page.enabled)) {
    return errorResponse(422, "invalid_current_page", "The selected page is not available and was not saved.");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .update({
      name: parsed.data.name,
      website_config: durable.config as unknown as Json,
      current_page_id: parsed.data.currentPageId,
    })
    .eq("id", projectId)
    .eq("user_id", ownership.project.user_id)
    .select("updated_at")
    .maybeSingle();
  if (error || !data) {
    console.error("[projects:autosave] project save failed", { code: error?.code ?? "not_found" });
    return errorResponse(error ? 503 : 404, error ? "save_unavailable" : "project_not_found", "The project could not be saved right now.");
  }

  return Response.json({ savedAt: data.updated_at, temporaryMediaCount: durable.temporaryMediaCount }, { headers: { "Cache-Control": "no-store" } });
}
