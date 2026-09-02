export function resolveWebsiteHref(href: string, publicBasePath?: string, currentPageSlug = "/"): string {
  if (!publicBasePath || (!href.startsWith("/") && !href.startsWith("#"))) return href;
  if (href.startsWith("#")) return `${publicBasePath}${currentPageSlug === "/" ? "" : currentPageSlug}${href}`;
  return href === "/" ? publicBasePath : `${publicBasePath}${href}`;
}
