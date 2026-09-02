"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { deleteAllProjectMedia } from "@/lib/media/storage-server";
import { NetlifyDomainProvider } from "@/lib/domains/netlify-provider";

const projectIdSchema = z.string().uuid();
const projectNameSchema = z.string().trim().min(1).max(80);

export async function createProjectAction() {
  const user = await requireUser("/dashboard");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .insert({ user_id: user.id, name: "Untitled site", website_config: null })
    .select("id")
    .single();

  if (error || !data) {
    console.error("[projects:create] project creation failed", { code: error?.code ?? "missing_data" });
    redirect("/dashboard?error=create");
  }
  redirect(`/build/${data.id}`);
}

export async function renameProjectAction(formData: FormData) {
  const id = projectIdSchema.safeParse(formData.get("projectId"));
  const name = projectNameSchema.safeParse(formData.get("name"));
  if (!id.success || !name.success) redirect("/dashboard?error=rename");

  const user = await requireUser("/dashboard");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .update({ name: name.data })
    .eq("id", id.data)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();
  if (error || !data) {
    console.error("[projects:rename] project rename failed", { code: error?.code ?? "not_found" });
    redirect("/dashboard?error=rename");
  }
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function deleteProjectAction(formData: FormData) {
  const id = projectIdSchema.safeParse(formData.get("projectId"));
  if (!id.success) redirect("/dashboard?error=delete");

  const user = await requireUser("/dashboard");
  const supabase = await createClient();
  const { data: project, error: lookupError } = await supabase
    .from("projects")
    .select("id")
    .eq("id", id.data)
    .eq("user_id", user.id)
    .maybeSingle();
  if (lookupError || !project) {
    console.error("[projects:delete] project lookup failed", { code: lookupError?.code ?? "not_found" });
    redirect("/dashboard?error=delete");
  }
  if (!await deleteAllProjectMedia(user.id, project.id)) {
    redirect("/dashboard?error=delete_media");
  }
  const { data: customDomains, error: domainsError } = await supabase.from("domains").select("hostname, provider_synced_at").eq("project_id", project.id).eq("user_id", user.id).eq("type", "custom");
  if (domainsError) redirect("/dashboard?error=delete_domains");
  try {
    const provider = new NetlifyDomainProvider();
    for (const domain of customDomains ?? []) if (domain.provider_synced_at) await provider.removeDomain(domain.hostname);
  } catch (error: unknown) {
    console.error("[projects:delete] domain cleanup failed", { name: error instanceof Error ? error.name : "UnknownError", projectId: project.id });
    redirect("/dashboard?error=delete_domains");
  }
  const { data, error } = await supabase
    .from("projects")
    .delete()
    .eq("id", id.data)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();
  if (error || !data) {
    console.error("[projects:delete] project deletion failed", { code: error?.code ?? "not_found" });
    redirect("/dashboard?error=delete");
  }
  revalidatePath("/dashboard");
  redirect("/dashboard");
}
