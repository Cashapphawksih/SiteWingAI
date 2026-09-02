import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SiteRenderer } from "@/components/site-renderer/site-renderer";
import { getPublicSite } from "@/lib/publishing/public-site";

export const dynamic = "force-dynamic";

interface PublicSitePageProps {
  params: Promise<{ slug: string; path?: string[] }>;
}

function requestedPageSlug(path?: string[]) {
  return path?.length ? `/${path.join("/")}` : "/";
}

export async function generateMetadata({ params }: PublicSitePageProps): Promise<Metadata> {
  const { slug, path } = await params;
  const site = await getPublicSite(slug);
  const page = site?.config.pages.find((candidate) => candidate.enabled && candidate.slug === requestedPageSlug(path));
  if (!site || !page) return { title: "Site unavailable", robots: { index: false, follow: false } };
  const title = page.slug === "/" ? site.config.business.name : `${page.title} | ${site.config.business.name}`;
  const description = site.config.business.tagline;
  const canonical = `/site/${slug}${page.slug === "/" ? "" : page.slug}`;
  return { title: { absolute: title }, description, alternates: { canonical }, openGraph: { title, description, type: "website", url: canonical } };
}

export default async function PublicSitePage({ params }: PublicSitePageProps) {
  const { slug, path } = await params;
  const site = await getPublicSite(slug);
  if (!site) notFound();
  const page = site.config.pages.find((candidate) => candidate.enabled && candidate.slug === requestedPageSlug(path));
  if (!page) notFound();
  return <SiteRenderer config={site.config} currentPageId={page.id} publicBasePath={`/site/${slug}`} />;
}
