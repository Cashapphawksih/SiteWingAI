import type { Metadata } from "next";
import Link from "next/link";

import { logoutAction } from "@/app/(auth)/actions";
import { createProjectAction, renameProjectAction } from "@/app/dashboard/actions";
import { BrandMark } from "@/components/brand-mark";
import { DeleteProjectControl } from "@/components/dashboard/delete-project-control";
import { requireUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { parseWebsiteConfigInput } from "@/lib/ai/website-config-schema";
import { prepareWebsiteConfigForPersistence } from "@/lib/projects/persistence";
import { hashWebsiteConfig } from "@/lib/publishing/config";
import { sitewingHostname } from "@/lib/domains/hostname";

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

export default async function DashboardPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser("/dashboard");
  const supabase = await createClient();
  const { data: projects, error } = await supabase
    .from("projects")
    .select("id, name, website_config, updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });
  const params = await searchParams;
  const actionError = typeof params.error === "string" ? errorMessages[params.error] : null;
  const { data: publications, error: publicationsError } = await supabase
    .from("published_sites")
    .select("project_id, public_slug, is_active, config_hash")
    .eq("user_id", user.id);
  const publicationByProject = new Map((publications ?? []).map((publication) => [publication.project_id, publication]));
  const { data: domains, error: domainsError } = await supabase.from("domains").select("project_id, hostname, status, type").eq("user_id", user.id);
  const customDomainsByProject = new Map<string, NonNullable<typeof domains>>();
  for (const domain of domains ?? []) if (domain.type === "custom") customDomainsByProject.set(domain.project_id, [...(customDomainsByProject.get(domain.project_id) ?? []), domain]);
  const projectRows = await Promise.all((projects ?? []).map(async (project) => {
    const publication = publicationByProject.get(project.id);
    let draftHash: string | null = null;
    if (project.website_config) {
      try { draftHash = await hashWebsiteConfig(prepareWebsiteConfigForPersistence(parseWebsiteConfigInput(project.website_config)).config); } catch { /* Builder reports invalid saved configuration. */ }
    }
    const publicationLabel = publication?.is_active
      ? draftHash === publication.config_hash ? "Published" : "Changes not published"
      : "Draft";
    return { ...project, publication, publicationLabel, customDomains: customDomainsByProject.get(project.id) ?? [] };
  }));

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-line bg-background">
        <div className="mx-auto flex min-h-18 w-full max-w-7xl items-center justify-between gap-5 px-5 sm:min-h-20 sm:px-8 lg:px-12">
          <BrandMark />
          <div className="flex items-center gap-4">
            <span className="hidden max-w-64 truncate text-xs text-muted sm:block">{user.email ?? "Signed in"}</span>
            <Link href="/billing" className="text-sm font-semibold underline decoration-line underline-offset-4 hover:decoration-foreground">Billing</Link>
            <form action={logoutAction}><button type="submit" className="border border-line px-4 py-2 text-xs font-semibold hover:border-foreground">Log out</button></form>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-5 py-12 sm:px-8 sm:py-16 lg:px-12 lg:py-20">
        <div className="flex flex-col gap-7 border-b border-line pb-10 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Your workspace</p>
            <h1 className="mt-4 text-4xl font-medium tracking-[-0.045em] sm:text-5xl">Website projects</h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-muted">Open a saved project or create a new private workspace.</p>
          </div>
          <form action={createProjectAction}>
            <button type="submit" className="min-h-12 bg-foreground px-6 text-sm font-semibold text-background transition-colors hover:bg-accent">Create project</button>
          </form>
        </div>

        {actionError ? <p className="mt-6 border-l-2 border-red-700 bg-red-50 px-4 py-3 text-sm text-red-900" role="alert">{actionError}</p> : null}
        {error || publicationsError || domainsError ? (
          <section className="mt-10 border border-line bg-surface p-8" role="alert"><h2 className="text-xl font-medium">Projects are temporarily unavailable.</h2><p className="mt-3 text-sm text-muted">Refresh the page or try again shortly.</p></section>
        ) : projectRows.length ? (
          <div className="mt-10 grid gap-px border border-line bg-line md:grid-cols-2 xl:grid-cols-3">
            {projectRows.map((project) => (
              <article key={project.id} className="flex min-h-72 flex-col bg-background p-6 sm:p-7">
                <div className="flex items-center justify-between gap-4 text-xs">
                  <span className="font-semibold uppercase tracking-[0.12em] text-accent">{project.publicationLabel}</span>
                  <span className="text-muted">{project.website_config ? "Website created" : "Not generated"}</span>
                </div>
                <h2 className="mt-10 text-2xl font-medium tracking-[-0.03em]">{project.name}</h2>
                <p className="mt-3 text-xs leading-5 text-muted">Updated {updatedLabel(project.updated_at)}</p>
                {project.publication?.is_active ? <p className="mt-3 truncate text-xs text-muted">{sitewingHostname(project.publication.public_slug)}</p> : null}
                {project.customDomains.length ? <p className="mt-1 truncate text-xs text-muted">{project.customDomains[0].hostname} · {project.customDomains[0].status === "active" ? "Connected" : "Pending DNS"}</p> : null}
                <div className="mt-auto flex items-center justify-between gap-4 border-t border-line pt-5">
                  <div className="flex items-center gap-4">
                    <Link href={`/build/${project.id}`} className="text-sm font-semibold underline decoration-line underline-offset-4 hover:decoration-foreground">Open project</Link>
                    {project.publication?.is_active ? <a href={`https://${sitewingHostname(project.publication.public_slug)}`} target="_blank" rel="noreferrer" className="text-sm text-accent underline underline-offset-4">Open site</a> : null}
                  </div>
                  <DeleteProjectControl projectId={project.id} projectName={project.name} />
                </div>
                <form action={renameProjectAction} className="mt-5 flex border border-line bg-white focus-within:border-foreground">
                  <input type="hidden" name="projectId" value={project.id} />
                  <label className="sr-only" htmlFor={`rename-${project.id}`}>Rename {project.name}</label>
                  <input id={`rename-${project.id}`} name="name" defaultValue={project.name} maxLength={80} required className="min-w-0 flex-1 bg-transparent px-3 py-2 text-xs outline-none" />
                  <button type="submit" className="border-l border-line px-3 text-xs font-semibold hover:bg-surface">Rename</button>
                </form>
              </article>
            ))}
          </div>
        ) : (
          <section className="mt-10 flex min-h-72 flex-col items-start justify-between border border-line bg-surface p-8 sm:p-10">
            <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">No projects yet</p><h2 className="mt-4 text-3xl font-medium tracking-[-0.04em]">Start with one clear brief.</h2><p className="mt-4 max-w-md text-sm leading-7 text-muted">Your generated site, pages, edits, and conversation will be saved to this account.</p></div>
            <form action={createProjectAction} className="mt-10"><button type="submit" className="min-h-11 border border-foreground px-5 text-sm font-semibold hover:bg-foreground hover:text-background">Create your first project</button></form>
          </section>
        )}
      </main>
    </div>
  );
}
