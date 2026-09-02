import type { CSSProperties } from "react";

import { createProjectMediaUrl, parseProjectMediaPath, parsePublishedMediaUrl } from "@/lib/media/storage-media";
import type {
  FooterSection,
  LegacyWebsiteConfig,
  WebsiteConfig,
  WebsiteConfigInput,
  WebsiteMedia,
  WebsitePage,
  WebsiteSection,
} from "@/types/website";
import {
  DEFAULT_SECTION_VARIANTS,
  DEFAULT_THEME_TOKENS,
  SECTION_VARIANTS,
  getSectionVariant,
  getThemeTokens,
  isVariantSectionType,
  withDefaultSectionVariant,
} from "@/lib/website-design-system";

const hexColorPattern = /^#[0-9a-f]{6}$/i;
const stableIdPattern = /^[a-z][a-z0-9-]*$/;
const slugPattern = /^\/(?:[a-z][a-z0-9-]*(?:\/[a-z][a-z0-9-]*)*)?$/;

export type WebsiteThemeProperties = CSSProperties & {
  "--website-primary": string;
  "--website-background": string;
  "--website-text": string;
  "--website-radius": string;
  "--website-content-width": string;
  "--website-section-space": string;
};

export function getWebsiteThemeProperties(config: WebsiteConfig): WebsiteThemeProperties {
  const tokens = getThemeTokens(config.theme);
  const contentWidths = { narrow: "1040px", standard: "1240px", wide: "1440px" } as const;
  const sectionSpaces = { compact: "72px", comfortable: "112px", generous: "148px" } as const;
  const radii = { square: "0px", subtle: config.theme.borderRadius, rounded: "24px" } as const;
  return {
    "--website-primary": config.theme.primaryColor,
    "--website-background": config.theme.backgroundColor,
    "--website-text": config.theme.textColor,
    "--website-radius": radii[tokens.radiusStyle],
    "--website-content-width": contentWidths[tokens.contentWidth],
    "--website-section-space": sectionSpaces[tokens.spacingDensity],
  };
}

export function getEnabledSections(page: WebsitePage): WebsiteSection[] {
  return page.sections.filter((section) => section.enabled);
}

export function getEnabledPages(config: WebsiteConfig): WebsitePage[] {
  return config.pages.filter((page) => page.enabled);
}

export function getHomePage(config: WebsiteConfig): WebsitePage {
  return config.pages.find((page) => page.slug === "/") ?? config.pages[0];
}

export function getPageById(config: WebsiteConfig, pageId: string | undefined): WebsitePage | undefined {
  return config.pages.find((page) => page.id === pageId);
}

export function getPageByHref(config: WebsiteConfig, href: string): WebsitePage | undefined {
  const path = href.split("#", 1)[0] || "/";
  return config.pages.find((page) => page.enabled && page.slug === path);
}

export function getPhoneHref(phone: string): `tel:${string}` {
  return `tel:${phone.replace(/[^+\d]/g, "")}`;
}

export function getEmailHref(email: string): `mailto:${string}` {
  return `mailto:${email}`;
}

function defaultLegacyFooter(config: LegacyWebsiteConfig): FooterSection {
  return {
    id: "footer",
    type: "footer",
    enabled: true,
    content: {
      statement: config.business.tagline,
      copyright: `© ${new Date().getFullYear()} ${config.business.name}.`,
    },
  };
}

export function normalizeWebsiteConfig(config: WebsiteConfigInput): WebsiteConfig {
  if (config.version === 2) return applyDesignDefaults(config);
  const footer = config.sections.find((section): section is FooterSection => section.type === "footer") ?? defaultLegacyFooter(config);
  return applyDesignDefaults({
    version: 2,
    business: structuredClone(config.business),
    theme: structuredClone(config.theme),
    navigation: structuredClone(config.navigation),
    pages: [{
      id: "home",
      slug: "/",
      title: "Home",
      navLabel: "Home",
      enabled: true,
      sections: structuredClone(config.sections.filter((section) => section.type !== "footer")),
    }],
    footer: structuredClone(footer),
  });
}

function applyDesignDefaults(config: WebsiteConfig): WebsiteConfig {
  const next = structuredClone(config);
  next.theme = { ...DEFAULT_THEME_TOKENS, ...next.theme };
  for (const page of next.pages) {
    page.sections = page.sections.map((section) => withDefaultSectionVariant(section)) as WebsitePage["sections"];
  }
  next.footer.variant ??= DEFAULT_SECTION_VARIANTS.footer;
  return next;
}

function validateStableId(id: string, label: string, errors: string[]) {
  if (!stableIdPattern.test(id)) errors.push(`${label} id "${id}" must use lowercase letters, numbers, and hyphens.`);
}

function validateMedia(media: WebsiteMedia, label: string, errors: string[]) {
  if (media.kind === "placeholder") {
    if (!media.label.trim()) errors.push(`${label} placeholder label cannot be empty.`);
    return;
  }
  if (!media.alt.trim()) errors.push(`${label} alt text cannot be empty.`);
  if (media.alt.length > 500) errors.push(`${label} alt text must be 500 characters or fewer.`);
  const isTemporary = media.source === "temporary" || media.src.startsWith("blob:");
  const isStorage = media.source === "storage";
  if (isTemporary && (!media.src.startsWith("blob:") || media.source !== "temporary")) {
    errors.push(`${label} temporary source is malformed.`);
  }
  if (isStorage) {
    const parsedPath = media.storagePath ? parseProjectMediaPath(media.storagePath) : null;
    const publicMedia = parsePublishedMediaUrl(media.src);
    const isDraftUrl = parsedPath && media.src === createProjectMediaUrl(parsedPath.projectId, media.storagePath ?? "");
    const isPublishedUrl = parsedPath && publicMedia?.assetId === parsedPath.assetId;
    if (!parsedPath || (!isDraftUrl && !isPublishedUrl)) {
      errors.push(`${label} persistent storage source is malformed.`);
    }
  } else if (media.storagePath !== undefined) {
    errors.push(`${label} storage path is only valid for persistent media.`);
  }
  if (!isTemporary && !isStorage && !/^https:\/\/[^\s]+$/.test(media.src)) {
    errors.push(`${label} must use an HTTPS image source.`);
  }
  if (media.mimeType && !["image/jpeg", "image/png", "image/webp"].includes(media.mimeType)) {
    errors.push(`${label} has an unsupported image type.`);
  }
  if ((media.width !== undefined || media.height !== undefined) && (!(media.width && media.height) || media.width < 1 || media.height < 1)) {
    errors.push(`${label} dimensions are invalid.`);
  }
}

export function validateWebsiteConfig(config: WebsiteConfig): string[] {
  const errors: string[] = [];
  for (const [field, value] of Object.entries(config.business)) {
    if (!value.trim()) errors.push(`Business field "${field}" cannot be empty.`);
  }
  for (const [field, value] of [["primaryColor", config.theme.primaryColor], ["backgroundColor", config.theme.backgroundColor], ["textColor", config.theme.textColor]] as const) {
    if (!hexColorPattern.test(value)) errors.push(`Theme field "${field}" must be a six-digit hex color.`);
  }
  const themeTokens = getThemeTokens(config.theme);
  const allowedThemeTokens = {
    fontPairing: ["modern-sans", "editorial-serif", "classic-serif", "condensed-impact", "humanist-sans"],
    headingScale: ["compact", "balanced", "display"],
    contentWidth: ["narrow", "standard", "wide"],
    spacingDensity: ["compact", "comfortable", "generous"],
    radiusStyle: ["square", "subtle", "rounded"],
    borderStyle: ["none", "subtle", "strong"],
    surfaceContrast: ["flat", "layered", "high"],
    buttonStyle: ["solid", "outline", "pill"],
    navigationStyle: ["minimal", "centered", "classic", "transparent"],
  } as const;
  for (const key of Object.keys(allowedThemeTokens) as Array<keyof typeof allowedThemeTokens>) {
    if (!(allowedThemeTokens[key] as readonly string[]).includes(themeTokens[key])) {
      errors.push(`Theme token "${key}" is unsupported.`);
    }
  }
  if (config.pages.length === 0) errors.push("A website must contain at least one page.");

  const pageIds = new Set<string>();
  const slugs = new Set<string>();
  const sectionIds = new Set<string>();
  let homeCount = 0;
  for (const page of config.pages) {
    validateStableId(page.id, "Page", errors);
    if (pageIds.has(page.id)) errors.push(`Page id "${page.id}" must be unique.`);
    pageIds.add(page.id);
    if (!slugPattern.test(page.slug)) errors.push(`Page slug "${page.slug}" is invalid.`);
    if (slugs.has(page.slug)) errors.push(`Page slug "${page.slug}" must be unique.`);
    slugs.add(page.slug);
    if (!page.title.trim() || !page.navLabel.trim()) errors.push(`Page "${page.id}" needs a title and navigation label.`);
    if (page.slug === "/") {
      homeCount += 1;
      if (!page.enabled) errors.push("The Home page must remain enabled.");
    }
    for (const section of page.sections) {
      validateStableId(section.id, `Section on ${page.title}`, errors);
      if (sectionIds.has(section.id)) errors.push(`Section id "${section.id}" must be unique across the website.`);
      sectionIds.add(section.id);
      if (isVariantSectionType(section.type)) {
        const variant = getSectionVariant(section);
        if (!variant || !(SECTION_VARIANTS[section.type] as readonly string[]).includes(variant)) {
          errors.push(`Section "${section.id}" uses an unsupported ${section.type} layout.`);
        }
      }
      if (section.type === "hero" && section.content.media) validateMedia(section.content.media, `Hero media on "${page.title}"`, errors);
      if (section.type === "gallery") {
        const itemIds = new Set<string>();
        for (const item of section.content.items) {
          validateStableId(item.id, `Gallery item on ${page.title}`, errors);
          if (itemIds.has(item.id)) errors.push(`Gallery item id "${item.id}" must be unique within its section.`);
          itemIds.add(item.id);
          validateMedia(item.media, `Gallery item "${item.title}"`, errors);
        }
      }
    }
  }
  if (homeCount !== 1) errors.push("A website must have exactly one enabled Home page with slug /.");
  validateStableId(config.footer.id, "Footer", errors);
  if (!(SECTION_VARIANTS.footer as readonly string[]).includes(getSectionVariant(config.footer) ?? "")) {
    errors.push("The footer uses an unsupported layout.");
  }
  if (!config.footer.enabled) errors.push("The global footer must remain enabled.");

  const enabledSlugs = new Set<string>(config.pages.filter((page) => page.enabled).map((page) => page.slug));
  const home = config.pages.find((page) => page.slug === "/");
  const enabledHomeSections = new Set(home?.sections.filter((section) => section.enabled).map((section) => section.id));
  const validateLinkTarget = (href: string, label: string, hashTargets: Set<string>) => {
    if (href.startsWith("#") && !hashTargets.has(href.slice(1))) {
      errors.push(`${label} points to a missing or disabled section.`);
    }
    if (href.startsWith("/")) {
      const path = href.split("#", 1)[0] || "/";
      if (!enabledSlugs.has(path)) errors.push(`${label} points to a missing or disabled page.`);
    }
  };
  const navigationIds = new Set<string>();
  for (const item of config.navigation) {
    validateStableId(item.id, "Navigation item", errors);
    if (navigationIds.has(item.id)) errors.push(`Navigation item id "${item.id}" must be unique.`);
    navigationIds.add(item.id);
    validateLinkTarget(item.href, `Navigation item "${item.label}"`, enabledHomeSections);
  }
  for (const page of config.pages) {
    const enabledPageSections = new Set(page.sections.filter((section) => section.enabled).map((section) => section.id));
    for (const section of page.sections) {
      if (section.type !== "hero" && section.type !== "cta") continue;
      validateLinkTarget(section.content.primaryAction.href, `${section.type} primary action on "${page.title}"`, enabledPageSections);
      if (section.content.secondaryAction) {
        validateLinkTarget(section.content.secondaryAction.href, `${section.type} secondary action on "${page.title}"`, enabledPageSections);
      }
    }
  }
  for (const link of config.footer.content.links ?? []) {
    validateLinkTarget(link.href, `Footer link "${link.label}"`, enabledHomeSections);
  }
  return errors;
}

export function assertValidWebsiteConfig(config: WebsiteConfig): void {
  const errors = validateWebsiteConfig(config);
  if (errors.length > 0) throw new Error(`Invalid WebsiteConfig:\n${errors.join("\n")}`);
}
