import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { SiteRenderer } from "@/components/site-renderer/site-renderer";
import { resolvePublishedSiteFromHost } from "@/lib/domains/hostname";
import { getPublicSite, getPublicSiteByHostname } from "@/lib/publishing/public-site";

export const dynamic = "force-dynamic";

interface HostSitePageProps { params: Promise<{ path?: string[] }> }

function pageSlug(path?: string[]) { return path?.length ? `/${path.join("/")}` : "/"; }

async function resolveRequestSite() {
  const requestHeaders = await headers();
  const host = resolvePublishedSiteFromHost(requestHeaders.get("host"));
  if (host.kind === "sitewing") return { hostname: host.hostname, site: await getPublicSite(host.publicSlug) };
  if (host.kind === "custom") return { hostname: host.hostname, site: await getPublicSiteByHostname(host.hostname) };
  return null;
}

export async function generateMetadata({ params }: HostSitePageProps): Promise<Metadata> {
  const [{ path }, resolved] = await Promise.all([params, resolveRequestSite()]);
  const page = resolved?.site?.config.pages.find((candidate) => candidate.enabled && candidate.slug === pageSlug(path));
  if (!resolved?.site || !page) return { title: "Site unavailable", robots: { index: false, follow: false } };
  const title = page.slug === "/" ? resolved.site.config.business.name : `${page.title} | ${resolved.site.config.business.name}`;
  const description = resolved.site.config.business.tagline;
  const canonical = `https://${resolved.hostname}${page.slug === "/" ? "" : page.slug}`;
  return { title: { absolute: title }, description, alternates: { canonical }, openGraph: { title, description, type: "website", url: canonical } };
}

export default async function HostSitePage({ params }: HostSitePageProps) {
  const [{ path }, resolved] = await Promise.all([params, resolveRequestSite()]);
  if (!resolved?.site) notFound();
  const page = resolved.site.config.pages.find((candidate) => candidate.enabled && candidate.slug === pageSlug(path));
  if (!page) notFound();
  return <SiteRenderer config={resolved.site.config} currentPageId={page.id} />;
}
