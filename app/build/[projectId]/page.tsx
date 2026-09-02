import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";

import { PreviewWorkspace } from "@/components/builder/preview-workspace";
import { parseWebsiteConfigInput } from "@/lib/ai/website-config-schema";
import { requireUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { apexTintConfig } from "@/lib/website-configs/apex-tint";
import { getHomePage } from "@/lib/website-config";
import type { PersistedProjectMessage } from "@/types/project";
import type { WebsiteConfig } from "@/types/website";
import type { PublicationState } from "@/types/publication";
import type { DnsInstruction, ProjectDomain } from "@/types/domain";
import { getDomainRuntimeConfig } from "@/lib/domains/config";
import { NetlifyDomainProvider } from "@/lib/domains/netlify-provider";
import { serializeDomain } from "@/lib/domains/serialization";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "SiteWing Builder", description: "Create and refine a saved website project." };

function LoadError({ message }: { message: string }) {
  return (
    <main className="grid min-h-screen place-items-center bg-background px-5 text-foreground">
      <section className="max-w-lg border border-line bg-surface p-8"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Project unavailable</p><h1 className="mt-4 text-3xl font-medium tracking-[-0.04em]">This project could not be opened safely.</h1><p className="mt-4 text-sm leading-7 text-muted">{message}</p><Link href="/dashboard" className="mt-7 inline-flex min-h-11 items-center bg-foreground px-5 text-sm font-semibold text-background">Return to dashboard</Link></section>
    </main>
  );
}

export default async function ProjectBuilderPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  if (!z.string().uuid().safeParse(projectId).success) notFound();
  const user = await requireUser(`/build/${projectId}`);
  const supabase = await createClient();
  const { data: project, error } = await supabase
    .from("projects")
    .select("id, name, website_config, current_page_id")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) {
    console.error("[builder:load] project query failed", { code: error.code });
    return <LoadError message="The saved project is temporarily unavailable. Refresh or try again shortly." />;
  }
  if (!project) notFound();

  let initialConfig: WebsiteConfig | null = null;
  if (project.website_config) {
    try {
      initialConfig = parseWebsiteConfigInput(project.website_config);
    } catch {
      console.error("[builder:load] rejected invalid persisted WebsiteConfig", { projectId });
      return <LoadError message="Its saved website configuration did not pass SiteWing validation. No data was changed." />;
    }
  }

  const { data: messageRows, error: messagesError } = await supabase
    .from("project_messages")
    .select("id, role, content, created_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });
  if (messagesError) {
    console.error("[builder:load] message query failed", { code: messagesError.code, projectId });
    return <LoadError message="The project conversation could not be loaded. Refresh or try again shortly." />;
  }
  const initialMessages: PersistedProjectMessage[] = (messageRows ?? []).map((message) => ({
    id: message.id,
    role: message.role,
    content: message.content,
    createdAt: message.created_at,
  }));
  const { data: publication, error: publicationError } = await supabase
    .from("published_sites")
    .select("public_slug, is_active, config_hash, published_at")
    .eq("project_id", projectId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (publicationError) {
    console.error("[builder:load] publication query failed", { code: publicationError.code, projectId });
    return <LoadError message="The project's publication status could not be loaded safely." />;
  }
  const initialPublication: PublicationState = publication ? {
    publicSlug: publication.public_slug,
    isActive: publication.is_active,
    configHash: publication.config_hash,
    publishedAt: publication.published_at,
  } : { publicSlug: null, isActive: false, configHash: null, publishedAt: null };
  const { data: domainRows, error: domainsError } = await supabase
    .from("domains")
    .select("*")
    .eq("project_id", projectId)
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });
  if (domainsError) {
    console.error("[builder:load] domains query failed", { code: domainsError.code, projectId });
    return <LoadError message="The project's domains could not be loaded safely." />;
  }
  const initialDomains: ProjectDomain[] = (domainRows ?? []).map(serializeDomain);
  const initialDomainInstructions: Record<string, DnsInstruction[]> = {};
  try {
    const provider = new NetlifyDomainProvider();
    for (const domain of initialDomains) if (domain.type === "custom" && domain.status !== "active") initialDomainInstructions[domain.id] = provider.getDnsInstructions(domain.hostname, domain.verificationToken);
  } catch { /* Domain controls show configuration errors when used. */ }
  const fallbackPageId = getHomePage(initialConfig ?? apexTintConfig).id;
  const initialPageId = initialConfig?.pages.some((page) => page.id === project.current_page_id && page.enabled)
    ? project.current_page_id ?? fallbackPageId
    : fallbackPageId;

  return <PreviewWorkspace initialConfig={initialConfig ?? apexTintConfig} initialDomains={initialDomains} initialDomainInstructions={initialDomainInstructions} initialHasGeneratedProject={Boolean(initialConfig)} initialMessages={initialMessages} initialPageId={initialPageId} initialProjectName={project.name} initialPublication={initialPublication} projectId={project.id} rootDomain={getDomainRuntimeConfig().rootDomain} />;
}
