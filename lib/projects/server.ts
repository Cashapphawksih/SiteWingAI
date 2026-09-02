import "server-only";

import { z } from "zod";

import { getAuthenticatedUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";

const projectIdSchema = z.string().uuid();

export type OwnedProjectResult =
  | {
      ok: true;
      project: {
        id: string;
        user_id: string;
        name: string;
        website_config: import("@/types/supabase").Json | null;
        current_page_id: string | null;
        created_at: string;
        updated_at: string;
      };
    }
  | { ok: false; status: 400 | 401 | 404 | 503; code: string; message: string };

export async function getOwnedProject(projectId: string): Promise<OwnedProjectResult> {
  if (!projectIdSchema.safeParse(projectId).success) {
    return { ok: false, status: 400, code: "invalid_project", message: "The project ID is invalid." };
  }
  const user = await getAuthenticatedUser();
  if (!user) return { ok: false, status: 401, code: "authentication_required", message: "Log in to continue." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("id, user_id, name, website_config, current_page_id, created_at, updated_at")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("[projects:ownership] project lookup failed", { code: error.code });
    return { ok: false, status: 503, code: "project_unavailable", message: "The project is temporarily unavailable." };
  }
  if (!data) return { ok: false, status: 404, code: "project_not_found", message: "The project was not found." };
  return { ok: true, project: data };
}

export async function persistProjectMessage(projectId: string, role: "user" | "assistant", content: string): Promise<boolean> {
  const supabase = await createClient();
  const { error } = await supabase.from("project_messages").insert({ project_id: projectId, role, content });
  if (error) {
    console.error("[project-messages:insert] message persistence failed", { code: error.code, role });
    return false;
  }
  return true;
}
