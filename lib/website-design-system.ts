import type {
  WebsiteSection,
  WebsiteSectionType,
  WebsiteTheme,
} from "@/types/website";

export const SECTION_VARIANTS = {
  hero: ["split", "centered", "editorial", "image-led", "minimal", "bold-service"],
  services: ["grid", "numbered-list", "alternating", "cards", "editorial-list"],
  about: ["split-media", "editorial", "stats-led", "minimal"],
  gallery: ["grid", "masonry-like", "featured-first", "horizontal-editorial"],
  testimonials: ["cards", "quote-feature", "compact-grid"],
  cta: ["centered", "split", "banner", "minimal"],
  contact: ["split", "card", "minimal", "details-first"],
  footer: ["compact", "multi-column", "editorial"],
} as const;

export type VariantSectionType = keyof typeof SECTION_VARIANTS;
export type WebsiteSectionVariant = (typeof SECTION_VARIANTS)[VariantSectionType][number];

export const DEFAULT_SECTION_VARIANTS = {
  hero: "split",
  services: "grid",
  about: "editorial",
  gallery: "featured-first",
  testimonials: "cards",
  cta: "split",
  contact: "split",
  footer: "compact",
} as const satisfies Record<VariantSectionType, WebsiteSectionVariant>;

export const DEFAULT_THEME_TOKENS = {
  fontPairing: "modern-sans",
  headingScale: "balanced",
  contentWidth: "standard",
  spacingDensity: "comfortable",
  radiusStyle: "subtle",
  borderStyle: "subtle",
  surfaceContrast: "layered",
  buttonStyle: "solid",
  navigationStyle: "classic",
} as const satisfies Required<Pick<WebsiteTheme,
  | "fontPairing"
  | "headingScale"
  | "contentWidth"
  | "spacingDensity"
  | "radiusStyle"
  | "borderStyle"
  | "surfaceContrast"
  | "buttonStyle"
  | "navigationStyle"
>>;

export const VARIANT_LABELS: Record<WebsiteSectionVariant, string> = {
  split: "Split",
  centered: "Centered",
  editorial: "Editorial",
  "image-led": "Image-led",
  minimal: "Minimal",
  "bold-service": "Bold service",
  grid: "Grid",
  "numbered-list": "Numbered list",
  alternating: "Alternating",
  cards: "Cards",
  "editorial-list": "Editorial list",
  "split-media": "Split media",
  "stats-led": "Stats led",
  "masonry-like": "Masonry-like",
  "featured-first": "Featured first",
  "horizontal-editorial": "Horizontal editorial",
  "quote-feature": "Featured quote",
  "compact-grid": "Compact grid",
  banner: "Banner",
  card: "Card",
  "details-first": "Details first",
  compact: "Compact",
  "multi-column": "Multi-column",
};

export function isVariantSectionType(type: WebsiteSectionType): type is VariantSectionType {
  return type in SECTION_VARIANTS;
}

export function getSectionVariant(section: WebsiteSection): WebsiteSectionVariant | undefined {
  switch (section.type) {
    case "hero": return section.variant ?? DEFAULT_SECTION_VARIANTS.hero;
    case "services": return section.variant ?? DEFAULT_SECTION_VARIANTS.services;
    case "about": return section.variant ?? DEFAULT_SECTION_VARIANTS.about;
    case "gallery": return section.variant ?? DEFAULT_SECTION_VARIANTS.gallery;
    case "testimonials": return section.variant ?? DEFAULT_SECTION_VARIANTS.testimonials;
    case "cta": return section.variant ?? DEFAULT_SECTION_VARIANTS.cta;
    case "contact": return section.variant ?? DEFAULT_SECTION_VARIANTS.contact;
    case "footer": return section.variant ?? DEFAULT_SECTION_VARIANTS.footer;
    case "faq": return undefined;
  }
}

export function withDefaultSectionVariant(section: WebsiteSection): WebsiteSection {
  switch (section.type) {
    case "hero": return { ...section, variant: section.variant ?? DEFAULT_SECTION_VARIANTS.hero };
    case "services": return { ...section, variant: section.variant ?? DEFAULT_SECTION_VARIANTS.services };
    case "about": return { ...section, variant: section.variant ?? DEFAULT_SECTION_VARIANTS.about };
    case "gallery": return { ...section, variant: section.variant ?? DEFAULT_SECTION_VARIANTS.gallery };
    case "testimonials": return { ...section, variant: section.variant ?? DEFAULT_SECTION_VARIANTS.testimonials };
    case "cta": return { ...section, variant: section.variant ?? DEFAULT_SECTION_VARIANTS.cta };
    case "contact": return { ...section, variant: section.variant ?? DEFAULT_SECTION_VARIANTS.contact };
    case "footer": return { ...section, variant: section.variant ?? DEFAULT_SECTION_VARIANTS.footer };
    case "faq": return section;
  }
}

export function getThemeTokens(theme: WebsiteTheme) {
  return {
    fontPairing: theme.fontPairing ?? DEFAULT_THEME_TOKENS.fontPairing,
    headingScale: theme.headingScale ?? DEFAULT_THEME_TOKENS.headingScale,
    contentWidth: theme.contentWidth ?? DEFAULT_THEME_TOKENS.contentWidth,
    spacingDensity: theme.spacingDensity ?? DEFAULT_THEME_TOKENS.spacingDensity,
    radiusStyle: theme.radiusStyle ?? DEFAULT_THEME_TOKENS.radiusStyle,
    borderStyle: theme.borderStyle ?? DEFAULT_THEME_TOKENS.borderStyle,
    surfaceContrast: theme.surfaceContrast ?? DEFAULT_THEME_TOKENS.surfaceContrast,
    buttonStyle: theme.buttonStyle ?? DEFAULT_THEME_TOKENS.buttonStyle,
    navigationStyle: theme.navigationStyle ?? DEFAULT_THEME_TOKENS.navigationStyle,
  };
}
