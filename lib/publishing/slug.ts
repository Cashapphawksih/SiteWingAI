const reservedSlugs = new Set([
  "admin", "api", "app", "assets", "auth", "billing", "build", "dashboard", "docs", "favicon",
  "help", "login", "mail", "media", "robots", "signup", "site", "sitemap", "status", "support", "www",
]);

export const publicSlugPattern = /^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])?$/;

export function normalizePublicSlug(value: string, fallbackId: string): string {
  let slug = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48)
    .replace(/-+$/g, "");
  if (slug.length < 3 || reservedSlugs.has(slug)) slug = `site-${fallbackId.slice(0, 8).toLowerCase()}`;
  return slug;
}

export function publicSlugCandidate(base: string, suffix: number): string {
  if (suffix <= 1) return base;
  const ending = `-${suffix}`;
  return `${base.slice(0, 63 - ending.length).replace(/-+$/g, "")}${ending}`;
}
