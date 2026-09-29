import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";

import { logoutAction } from "@/app/(auth)/actions";
import { createProjectAction, renameProjectAction } from "@/app/dashboard/actions";
import { DeleteProjectControl } from "@/components/dashboard/delete-project-control";
import { AppHeader, AppNotice, PageIntro, StatusBadge, TextLink } from "@/components/ui/app-ui";
import { parseWebsiteConfigInput } from "@/lib/ai/website-config-schema";
import { sitewingHostname } from "@/lib/domains/hostname";
import { prepareWebsiteConfigForPersistence } from "@/lib/projects/persistence";
import { hashWebsiteConfig } from "@/lib/publishing/config";
import { requireUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import type { WebsiteConfig } from "@/types/website";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Dashboard" };

const errorMessages: Record<string, string> = {
  create: "The project could not be created. Please try again.",
  rename: "The project could not be renamed.",
  delete: "The project could not be deleted.",
  delete_media: "The project media could not be removed safely, so the project was kept.",
  delete_domains: "A connected domain could not be removed safely, so the project was kept.",
};

function updatedLabel(value: string) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function previewStyle(config: WebsiteConfig | null): CSSProperties {
  return config ? {
    "--project-background": config.theme.backgroundColor,
    "--project-text": config.theme.textColor,
    "--project-accent": config.theme.primaryColor,
  } as CSSProperties : {};
}

export default async function DashboardPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser("/dashboard");
  const supabase = await createClient();
  const { data: projects, error } = await supabase.from("projects").select("id, name, website_config, updated_at").eq("user_id", user.id).order("updated_at", { ascending: false });
  const params = await searchParams;
  const actionError = typeof params.error === "string" ? errorMessages[params.error] : null;
  const { data: publications, error: publicationsError } = await supabase.from("published_sites").select("project_id, public_slug, is_active, config_hash").eq("user_id", user.id);
  const publicationByProject = new Map((publications ?? []).map((publication) => [publication.project_id, publication]));
  const { data: domains, error: domainsError } = await supabase.from("domains").select("project_id, hostname, status, type").eq("user_id", user.id);
  const customDomainsByProject = new Map<string, NonNullable<typeof domains>>();
  for (const domain of domains ?? []) if (domain.type === "custom") customDomainsByProject.set(domain.project_id, [...(customDomainsByProject.get(domain.project_id) ?? []), domain]);

  const projectRows = await Promise.all((projects ?? []).map(async (project) => {
    const publication = publicationByProject.get(project.id);
    let parsedConfig: WebsiteConfig | null = null;
    let draftHash: string | null = null;
    if (project.website_config) {
      try {
        parsedConfig = prepareWebsiteConfigForPersistence(parseWebsiteConfigInput(project.website_config)).config;
        draftHash = await hashWebsiteConfig(parsedConfig);
      } catch { /* Builder reports invalid saved configuration. */ }
    }
    const publicationLabel = publication?.is_active ? draftHash === publication.config_hash ? "Published" : "Changes not published" : "Draft";
    return { ...project, publication, publicationLabel, parsedConfig, customDomains: customDomainsByProject.get(project.id) ?? [] };
  }));

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader
        label="Website workspace"
        actions={<><span className="hidden max-w-56 truncate text-xs text-muted md:block">{user.email ?? "Signed in"}</span><TextLink href="/billing">Billing</TextLink><form action={logoutAction}><button type="submit" className="min-h-9 border border-line px-4 text-xs font-bold hover:border-foreground hover:bg-white">Log out</button></form></>}
      />

      <main className="mx-auto w-full max-w-[1480px] px-5 py-10 sm:px-8 sm:py-14 lg:px-10 lg:py-16">
        <PageIntro
          eyebrow="Your websites"
          title="Build, refine, and publish from one place."
          description="Every project is a private working website with its own pages, conversation, media, and publishing state."
          action={<form action={createProjectAction}><button type="submit" className="inline-flex min-h-12 items-center justify-center bg-foreground px-6 text-sm font-bold text-background hover:bg-accent">Create new website <span className="ml-3" aria-hidden="true">+</span></button></form>}
        />

        {actionError ? <div className="mt-6"><AppNotice tone="error">{actionError}</AppNotice></div> : null}
        {error || publicationsError || domainsError ? (
          <section className="mt-10 max-w-2xl"><AppNotice tone="error"><strong className="block">Projects are temporarily unavailable.</strong> Refresh the page or try again shortly.</AppNotice></section>
        ) : projectRows.length ? (
          <section className="mt-10" aria-labelledby="recent-sites-heading">
            <div className="mb-5 flex items-end justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted">Recent work</p><h2 id="recent-sites-heading" className="mt-2 text-2xl font-semibold tracking-[-0.04em]">Sites in progress</h2></div><span className="font-mono text-[10px] text-muted">{projectRows.length.toString().padStart(2, "0")} projects</span></div>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {projectRows.map((project) => {
                const preview = project.parsedConfig;
                const domain = project.customDomains[0];
                return (
                  <article key={project.id} className="group overflow-hidden border border-line bg-white transition-transform duration-200 hover:-translate-y-1 hover:border-foreground">
                    <Link href={`/build/${project.id}`} className="block focus-visible:outline-offset-[-3px]">
                      <div className="relative grid min-h-56 content-end overflow-hidden bg-[#22231f] p-6" style={previewStyle(preview)}>
                        {preview ? <><div className="absolute inset-0 bg-[var(--project-background)]" /><div className="absolute inset-x-0 top-0 h-12 border-b border-[color:var(--project-text)]/15" /><div className="relative max-w-[85%] text-[var(--project-text)]"><p className="text-[8px] font-bold uppercase tracking-[0.18em] text-[var(--project-accent)]">{preview.business.location}</p><h3 className="mt-3 text-3xl font-semibold leading-[0.95] tracking-[-0.055em]">{preview.business.name}</h3><p className="mt-3 line-clamp-2 text-[10px] leading-4 opacity-65">{preview.business.tagline}</p></div></> : <div className="relative"><p className="text-[9px] font-bold uppercase tracking-[0.16em] text-signal">New website</p><h3 className="mt-4 max-w-xs text-3xl font-semibold leading-[0.98] tracking-[-0.05em] text-white">Your first version starts with a clear brief.</h3></div>}
                        <span className="absolute bottom-5 right-5 grid size-8 place-items-center border border-white/20 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100" aria-hidden="true">↗</span>
                      </div>
                    </Link>
                    <div className="p-5 sm:p-6">
                      <div className="flex items-center justify-between gap-3"><StatusBadge tone={project.publication?.is_active ? project.publicationLabel === "Published" ? "live" : "pending" : "neutral"}>{project.publicationLabel}</StatusBadge><span className="text-[10px] text-muted">Updated {updatedLabel(project.updated_at)}</span></div>
                      <div className="mt-5 flex items-start justify-between gap-4"><div className="min-w-0"><h3 className="truncate text-xl font-semibold tracking-[-0.035em]">{project.name}</h3>{project.publication?.is_active ? <p className="mt-1 truncate text-xs text-muted">{domain?.hostname ?? sitewingHostname(project.publication.public_slug)}</p> : <p className="mt-1 text-xs text-muted">{preview ? `${preview.pages.length} page${preview.pages.length === 1 ? "" : "s"}` : "Waiting for first generation"}</p>}</div><DeleteProjectControl projectId={project.id} projectName={project.name} /></div>
                      <div className="mt-6 flex items-center gap-5 border-t border-line pt-4"><Link href={`/build/${project.id}`} className="text-sm font-bold underline decoration-line underline-offset-4 hover:decoration-foreground">Edit website</Link>{project.publication?.is_active ? <a href={`https://${sitewingHostname(project.publication.public_slug)}`} target="_blank" rel="noreferrer" className="text-sm text-accent underline underline-offset-4">View live</a> : null}</div>
                      <form action={renameProjectAction} className="mt-4 flex border border-line bg-background focus-within:border-foreground"><input type="hidden" name="projectId" value={project.id} /><label className="sr-only" htmlFor={`rename-${project.id}`}>Rename {project.name}</label><input id={`rename-${project.id}`} name="name" defaultValue={project.name} maxLength={80} required className="min-w-0 flex-1 bg-transparent px-3 py-2 text-xs outline-none" /><button type="submit" className="border-l border-line px-3 text-[10px] font-bold uppercase tracking-[0.08em] hover:bg-surface">Rename</button></form>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ) : (
          <section className="mt-10 grid min-h-96 border border-line bg-white md:grid-cols-[1.2fr_0.8fr]">
            <div className="flex flex-col justify-between p-8 sm:p-12"><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-accent">No websites yet</p><h2 className="mt-5 max-w-xl text-4xl font-semibold leading-[1] tracking-[-0.05em] sm:text-5xl">Start with the business. SiteWing will shape the site.</h2><p className="mt-5 max-w-md text-sm leading-7 text-muted">Your pages, edits, media, and conversation stay saved in one private workspace.</p></div><form action={createProjectAction} className="mt-10"><button type="submit" className="min-h-12 bg-foreground px-6 text-sm font-bold text-background hover:bg-accent">Create your first website</button></form></div>
            <div className="hidden bg-dark p-8 text-white md:flex md:flex-col md:justify-between"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-signal">A simple way to begin</p><div className="space-y-7">{["Describe the business", "Review the first version", "Refine and publish"].map((item, index) => <div key={item} className="border-t border-white/15 pt-4"><span className="font-mono text-[9px] text-white/35">0{index + 1}</span><p className="mt-2 text-sm font-semibold">{item}</p></div>)}</div></div>
          </section>
        )}
      </main>
    </div>
  );
}
