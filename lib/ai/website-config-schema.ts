import "server-only";

import { z } from "zod";

import { validateWebsiteConfig } from "@/lib/website-config";
import { DEFAULT_SECTION_VARIANTS, DEFAULT_THEME_TOKENS } from "@/lib/website-design-system";
import type {
  AboutSection,
  ContactSection,
  CtaSection,
  FaqSection,
  FooterSection,
  GallerySection,
  HexColor,
  HeroSection,
  ServicesSection,
  TestimonialsSection,
  WebsiteAction,
  BorderRadius,
  WebsiteConfig,
  WebsiteHref,
  WebsiteMedia,
  WebsitePage,
  WebsiteSection,
  WebsiteSlug,
} from "@/types/website";

const idSchema = z.string().regex(/^[a-z][a-z0-9-]*$/).max(64);
const copySchema = z.string().trim().min(1).max(1200);
const shortCopySchema = z.string().trim().min(1).max(160);
const nullableShortCopySchema = shortCopySchema.nullable();
const generatedMediaSrcSchema = z.string().trim().min(1).max(2000);
const validatedMediaSrcSchema = z.string().trim().max(2000).refine(
  (value) => value.startsWith("https://") || value.startsWith("blob:") || value.startsWith("/api/projects/") || value.startsWith("/api/public-sites/"),
);
const hrefSchema = z
  .string()
  .regex(/^(#[a-z][a-z0-9-]*|\/[a-zA-Z0-9/_-]*|https:\/\/[^\s]+|mailto:[^\s]+|tel:\+?[0-9]+)$/)
  .max(500);
const colorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/);
const borderRadiusSchema = z.string().regex(/^\d{1,2}px$/);
const slugSchema = z.string().regex(/^\/(?:[a-z][a-z0-9-]*(?:\/[a-z][a-z0-9-]*)*)?$/).max(120);

const actionSchema = z
  .object({
    label: shortCopySchema,
    href: hrefSchema,
    accessibleLabel: nullableShortCopySchema,
  })
  .strict();

const mediaSchema = z.discriminatedUnion("kind", [
  z
    .object({
      kind: z.literal("image"),
      src: generatedMediaSrcSchema,
      alt: z.string().trim().min(1).max(500),
      source: z.enum(["remote", "temporary", "storage"]).nullable(),
      storagePath: z.string().trim().min(1).max(300).nullable(),
      mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]).nullable(),
      width: z.number().int().min(1).max(12000).nullable(),
      height: z.number().int().min(1).max(12000).nullable(),
      fit: z.enum(["cover", "contain"]).nullable(),
    })
    .strict(),
  z
    .object({
      kind: z.literal("placeholder"),
      label: shortCopySchema,
    })
    .strict(),
]);

const sectionBase = {
  id: idSchema,
  enabled: z.boolean(),
};

const heroSectionSchema = z
  .object({
    ...sectionBase,
    type: z.literal("hero"),
    variant: z.enum(["split", "centered", "editorial", "image-led", "minimal", "bold-service"]),
    content: z
      .object({
        eyebrow: nullableShortCopySchema,
        heading: z.string().trim().min(1).max(140),
        description: z.string().trim().min(1).max(520),
        primaryAction: actionSchema,
        secondaryAction: actionSchema.nullable(),
        proofPoints: z.array(shortCopySchema).max(4).nullable(),
        media: mediaSchema.nullable(),
      })
      .strict(),
  })
  .strict();

const servicesSectionSchema = z
  .object({
    ...sectionBase,
    type: z.literal("services"),
    variant: z.enum(["grid", "numbered-list", "alternating", "cards", "editorial-list"]),
    content: z
      .object({
        eyebrow: nullableShortCopySchema,
        heading: z.string().trim().min(1).max(140),
        introduction: z.string().trim().min(1).max(420).nullable(),
        services: z
          .array(
            z
              .object({
                id: idSchema,
                number: z.string().trim().min(1).max(8).nullable(),
                name: shortCopySchema,
                description: z.string().trim().min(1).max(420),
                detail: z.string().trim().min(1).max(220).nullable(),
              })
              .strict(),
          )
          .min(1)
          .max(6),
      })
      .strict(),
  })
  .strict();

const aboutSectionSchema = z
  .object({
    ...sectionBase,
    type: z.literal("about"),
    variant: z.enum(["split-media", "editorial", "stats-led", "minimal"]),
    content: z
      .object({
        eyebrow: nullableShortCopySchema,
        heading: z.string().trim().min(1).max(140),
        body: z.array(copySchema).min(1).max(4),
        highlights: z
          .array(
            z
              .object({
                label: shortCopySchema,
                value: z.string().trim().min(1).max(32),
              })
              .strict(),
          )
          .max(4)
          .nullable(),
      })
      .strict(),
  })
  .strict();

const gallerySectionSchema = z
  .object({
    ...sectionBase,
    type: z.literal("gallery"),
    variant: z.enum(["grid", "masonry-like", "featured-first", "horizontal-editorial"]),
    content: z
      .object({
        eyebrow: nullableShortCopySchema,
        heading: z.string().trim().min(1).max(140),
        items: z
          .array(
            z
              .object({
                id: idSchema,
                title: shortCopySchema,
                category: nullableShortCopySchema,
                media: mediaSchema,
              })
              .strict(),
          )
          .min(1)
          .max(8),
      })
      .strict(),
  })
  .strict();

const testimonialsSectionSchema = z
  .object({
    ...sectionBase,
    type: z.literal("testimonials"),
    variant: z.enum(["cards", "quote-feature", "compact-grid"]),
    content: z
      .object({
        eyebrow: nullableShortCopySchema,
        heading: z.string().trim().min(1).max(140),
        testimonials: z
          .array(
            z
              .object({
                id: idSchema,
                quote: z.string().trim().min(1).max(520),
                name: shortCopySchema,
                context: nullableShortCopySchema,
              })
              .strict(),
          )
          .min(1)
          .max(6),
      })
      .strict(),
  })
  .strict();

const faqSectionSchema = z
  .object({
    ...sectionBase,
    type: z.literal("faq"),
    content: z
      .object({
        eyebrow: nullableShortCopySchema,
        heading: z.string().trim().min(1).max(140),
        items: z
          .array(
            z
              .object({
                id: idSchema,
                question: z.string().trim().min(1).max(220),
                answer: z.string().trim().min(1).max(700),
              })
              .strict(),
          )
          .min(1)
          .max(8),
      })
      .strict(),
  })
  .strict();

const ctaSectionSchema = z
  .object({
    ...sectionBase,
    type: z.literal("cta"),
    variant: z.enum(["centered", "split", "banner", "minimal"]),
    content: z
      .object({
        eyebrow: nullableShortCopySchema,
        heading: z.string().trim().min(1).max(140),
        description: z.string().trim().min(1).max(420).nullable(),
        primaryAction: actionSchema,
        secondaryAction: actionSchema.nullable(),
      })
      .strict(),
  })
  .strict();

const contactSectionSchema = z
  .object({
    ...sectionBase,
    type: z.literal("contact"),
    variant: z.enum(["split", "card", "minimal", "details-first"]),
    content: z
      .object({
        eyebrow: nullableShortCopySchema,
        heading: z.string().trim().min(1).max(140),
        description: z.string().trim().min(1).max(420).nullable(),
        phoneLabel: nullableShortCopySchema,
        emailLabel: nullableShortCopySchema,
        addressLabel: nullableShortCopySchema,
        hours: z
          .array(
            z
              .object({
                days: shortCopySchema,
                times: shortCopySchema,
              })
              .strict(),
          )
          .max(7)
          .nullable(),
      })
      .strict(),
  })
  .strict();

const footerSectionSchema = z
  .object({
    ...sectionBase,
    type: z.literal("footer"),
    variant: z.enum(["compact", "multi-column", "editorial"]),
    content: z
      .object({
        statement: nullableShortCopySchema,
        copyright: shortCopySchema,
        links: z
          .array(
            z
              .object({
                label: shortCopySchema,
                href: hrefSchema,
              })
              .strict(),
          )
          .max(8)
          .nullable(),
      })
      .strict(),
  })
  .strict();

const pageSectionSchema = z.discriminatedUnion("type", [
  heroSectionSchema,
  servicesSectionSchema,
  aboutSectionSchema,
  gallerySectionSchema,
  testimonialsSectionSchema,
  faqSectionSchema,
  ctaSectionSchema,
  contactSectionSchema,
]);

export const aiWebsiteConfigSchema = z
  .object({
    version: z.literal(2),
    business: z
      .object({
        name: shortCopySchema,
        tagline: shortCopySchema,
        phone: shortCopySchema,
        email: z.string().trim().min(1).max(254),
        location: shortCopySchema,
      })
      .strict(),
    theme: z
      .object({
        style: z.enum(["minimal", "editorial", "professional", "automotive"]),
        primaryColor: colorSchema,
        backgroundColor: colorSchema,
        textColor: colorSchema,
        fontStyle: z.enum(["sans", "serif", "condensed"]),
        borderRadius: borderRadiusSchema,
        fontPairing: z.enum(["modern-sans", "editorial-serif", "classic-serif", "condensed-impact", "humanist-sans"]),
        headingScale: z.enum(["compact", "balanced", "display"]),
        contentWidth: z.enum(["narrow", "standard", "wide"]),
        spacingDensity: z.enum(["compact", "comfortable", "generous"]),
        radiusStyle: z.enum(["square", "subtle", "rounded"]),
        borderStyle: z.enum(["none", "subtle", "strong"]),
        surfaceContrast: z.enum(["flat", "layered", "high"]),
        buttonStyle: z.enum(["solid", "outline", "pill"]),
        navigationStyle: z.enum(["minimal", "centered", "classic", "transparent"]),
      })
      .strict(),
    navigation: z
      .array(
        z
          .object({
            id: idSchema,
            label: shortCopySchema,
            href: hrefSchema,
          })
          .strict(),
      )
      .min(1)
      .max(8),
    pages: z
      .array(z.object({
        id: idSchema,
        slug: slugSchema,
        title: shortCopySchema,
        navLabel: shortCopySchema,
        enabled: z.boolean(),
        sections: z.array(pageSectionSchema).min(1).max(8),
      }).strict())
      .min(1)
      .max(8),
    footer: footerSectionSchema,
  })
  .strict();

type AIWebsiteConfig = z.infer<typeof aiWebsiteConfigSchema>;
type AISection = AIWebsiteConfig["pages"][number]["sections"][number] | AIWebsiteConfig["footer"];
type AIAction = z.infer<typeof actionSchema>;
type AIMedia = z.infer<typeof mediaSchema>;

function isUnknownRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeActionInput(value: unknown): unknown {
  if (!isUnknownRecord(value)) {
    return value;
  }

  return {
    ...value,
    accessibleLabel: value.accessibleLabel ?? null,
  };
}

function normalizeMediaInput(value: unknown): unknown {
  if (!isUnknownRecord(value) || value.kind !== "image") return value;
  return {
    ...value,
    source: value.source ?? (typeof value.src === "string" && value.src.startsWith("blob:")
      ? "temporary"
      : typeof value.src === "string" && (value.src.startsWith("/api/projects/") || value.src.startsWith("/api/public-sites/"))
        ? "storage"
        : "remote"),
    storagePath: value.storagePath ?? null,
    mimeType: value.mimeType ?? null,
    width: value.width ?? null,
    height: value.height ?? null,
    fit: value.fit ?? null,
  };
}

function normalizeSectionInput(value: unknown): unknown {
  if (!isUnknownRecord(value) || !isUnknownRecord(value.content)) {
    return value;
  }

  const content = value.content;

  switch (value.type) {
    case "hero":
      return {
        ...value,
        variant: value.variant ?? DEFAULT_SECTION_VARIANTS.hero,
        content: {
          ...content,
          eyebrow: content.eyebrow ?? null,
          primaryAction: normalizeActionInput(content.primaryAction),
          secondaryAction:
            content.secondaryAction == null
              ? null
              : normalizeActionInput(content.secondaryAction),
          proofPoints: content.proofPoints ?? null,
          media: content.media == null ? null : normalizeMediaInput(content.media),
        },
      };
    case "services":
      return {
        ...value,
        variant: value.variant ?? DEFAULT_SECTION_VARIANTS.services,
        content: {
          ...content,
          eyebrow: content.eyebrow ?? null,
          introduction: content.introduction ?? null,
          services: Array.isArray(content.services)
            ? content.services.map((service) =>
                isUnknownRecord(service)
                  ? {
                      ...service,
                      number: service.number ?? null,
                      detail: service.detail ?? null,
                    }
                  : service,
              )
            : content.services,
        },
      };
    case "about":
      return {
        ...value,
        variant: value.variant ?? DEFAULT_SECTION_VARIANTS.about,
        content: {
          ...content,
          eyebrow: content.eyebrow ?? null,
          highlights: content.highlights ?? null,
        },
      };
    case "gallery":
      return {
        ...value,
        variant: value.variant ?? DEFAULT_SECTION_VARIANTS.gallery,
        content: {
          ...content,
          eyebrow: content.eyebrow ?? null,
          items: Array.isArray(content.items)
            ? content.items.map((item) =>
                isUnknownRecord(item)
                  ? { ...item, category: item.category ?? null, media: normalizeMediaInput(item.media) }
                  : item,
              )
            : content.items,
        },
      };
    case "testimonials":
      return {
        ...value,
        variant: value.variant ?? DEFAULT_SECTION_VARIANTS.testimonials,
        content: {
          ...content,
          eyebrow: content.eyebrow ?? null,
          testimonials: Array.isArray(content.testimonials)
            ? content.testimonials.map((testimonial) =>
                isUnknownRecord(testimonial)
                  ? { ...testimonial, context: testimonial.context ?? null }
                  : testimonial,
              )
            : content.testimonials,
        },
      };
    case "faq":
      return {
        ...value,
        content: { ...content, eyebrow: content.eyebrow ?? null },
      };
    case "cta":
      return {
        ...value,
        variant: value.variant ?? DEFAULT_SECTION_VARIANTS.cta,
        content: {
          ...content,
          eyebrow: content.eyebrow ?? null,
          description: content.description ?? null,
          primaryAction: normalizeActionInput(content.primaryAction),
          secondaryAction:
            content.secondaryAction == null
              ? null
              : normalizeActionInput(content.secondaryAction),
        },
      };
    case "contact":
      return {
        ...value,
        variant: value.variant ?? DEFAULT_SECTION_VARIANTS.contact,
        content: {
          ...content,
          eyebrow: content.eyebrow ?? null,
          description: content.description ?? null,
          phoneLabel: content.phoneLabel ?? null,
          emailLabel: content.emailLabel ?? null,
          addressLabel: content.addressLabel ?? null,
          hours: content.hours ?? null,
        },
      };
    case "footer":
      return {
        ...value,
        variant: value.variant ?? DEFAULT_SECTION_VARIANTS.footer,
        content: {
          ...content,
          statement: content.statement ?? null,
          links: content.links ?? null,
        },
      };
    default:
      return value;
  }
}

function normalizeWebsiteConfigInput(input: unknown): unknown {
  if (!isUnknownRecord(input)) {
    return input;
  }

  if (input.version === 1 && Array.isArray(input.sections)) {
    const footer = input.sections.find((section) => isUnknownRecord(section) && section.type === "footer");
    return {
      version: 2,
      business: input.business,
      theme: normalizeThemeInput(input.theme),
      navigation: input.navigation,
      pages: [{
        id: "home",
        slug: "/",
        title: "Home",
        navLabel: "Home",
        enabled: true,
        sections: input.sections.filter((section) => !(isUnknownRecord(section) && section.type === "footer")).map(normalizeSectionInput),
      }],
      footer: normalizeSectionInput(footer),
    };
  }
  return {
    ...input,
    theme: normalizeThemeInput(input.theme),
    pages: Array.isArray(input.pages)
      ? input.pages.map((page) => isUnknownRecord(page) ? {
          ...page,
          sections: Array.isArray(page.sections) ? page.sections.map(normalizeSectionInput) : page.sections,
        } : page)
      : input.pages,
    footer: normalizeSectionInput(input.footer),
  };
}

function normalizeThemeInput(value: unknown): unknown {
  return isUnknownRecord(value) ? { ...DEFAULT_THEME_TOKENS, ...value } : value;
}

function assertNever(value: never): never {
  throw new Error(`Unsupported generated section: ${JSON.stringify(value)}`);
}

function normalizeHref(href: string): WebsiteHref {
  return href as WebsiteHref;
}

function normalizeHexColor(color: string): HexColor {
  return color as HexColor;
}

function normalizeBorderRadius(radius: string): BorderRadius {
  return radius as BorderRadius;
}

function normalizeAction(action: AIAction): WebsiteAction {
  return {
    label: action.label,
    href: normalizeHref(action.href),
    ...(action.accessibleLabel
      ? { accessibleLabel: action.accessibleLabel }
      : {}),
  };
}

function normalizeMedia(media: AIMedia): WebsiteMedia {
  return media.kind === "image"
    ? {
        kind: "image",
        src: validatedMediaSrcSchema.parse(media.src),
        alt: media.alt,
        ...(media.source ? { source: media.source } : {}),
        ...(media.storagePath ? { storagePath: media.storagePath } : {}),
        ...(media.mimeType ? { mimeType: media.mimeType } : {}),
        ...(media.width ? { width: media.width } : {}),
        ...(media.height ? { height: media.height } : {}),
        ...(media.fit ? { fit: media.fit } : {}),
      }
    : { kind: "placeholder", label: media.label };
}

function normalizeSection(section: AISection): WebsiteSection {
  switch (section.type) {
    case "hero": {
      const normalized: HeroSection = {
        id: section.id,
        type: section.type,
        enabled: section.enabled,
        variant: section.variant,
        content: {
          ...(section.content.eyebrow
            ? { eyebrow: section.content.eyebrow }
            : {}),
          heading: section.content.heading,
          description: section.content.description,
          primaryAction: normalizeAction(section.content.primaryAction),
          ...(section.content.secondaryAction
            ? {
                secondaryAction: normalizeAction(
                  section.content.secondaryAction,
                ),
              }
            : {}),
          ...(section.content.proofPoints
            ? { proofPoints: section.content.proofPoints }
            : {}),
          ...(section.content.media
            ? { media: normalizeMedia(section.content.media) }
            : {}),
        },
      };
      return normalized;
    }
    case "services": {
      const normalized: ServicesSection = {
        id: section.id,
        type: section.type,
        enabled: section.enabled,
        variant: section.variant,
        content: {
          ...(section.content.eyebrow
            ? { eyebrow: section.content.eyebrow }
            : {}),
          heading: section.content.heading,
          ...(section.content.introduction
            ? { introduction: section.content.introduction }
            : {}),
          services: section.content.services.map((service) => ({
            id: service.id,
            ...(service.number ? { number: service.number } : {}),
            name: service.name,
            description: service.description,
            ...(service.detail ? { detail: service.detail } : {}),
          })),
        },
      };
      return normalized;
    }
    case "about": {
      const normalized: AboutSection = {
        id: section.id,
        type: section.type,
        enabled: section.enabled,
        variant: section.variant,
        content: {
          ...(section.content.eyebrow
            ? { eyebrow: section.content.eyebrow }
            : {}),
          heading: section.content.heading,
          body: section.content.body,
          ...(section.content.highlights
            ? { highlights: section.content.highlights }
            : {}),
        },
      };
      return normalized;
    }
    case "gallery": {
      const normalized: GallerySection = {
        id: section.id,
        type: section.type,
        enabled: section.enabled,
        variant: section.variant,
        content: {
          ...(section.content.eyebrow
            ? { eyebrow: section.content.eyebrow }
            : {}),
          heading: section.content.heading,
          items: section.content.items.map((item) => ({
            id: item.id,
            title: item.title,
            ...(item.category ? { category: item.category } : {}),
            media: normalizeMedia(item.media),
          })),
        },
      };
      return normalized;
    }
    case "testimonials": {
      const normalized: TestimonialsSection = {
        id: section.id,
        type: section.type,
        enabled: section.enabled,
        variant: section.variant,
        content: {
          ...(section.content.eyebrow
            ? { eyebrow: section.content.eyebrow }
            : {}),
          heading: section.content.heading,
          testimonials: section.content.testimonials.map((testimonial) => ({
            id: testimonial.id,
            quote: testimonial.quote,
            name: testimonial.name,
            ...(testimonial.context
              ? { context: testimonial.context }
              : {}),
          })),
        },
      };
      return normalized;
    }
    case "faq": {
      const normalized: FaqSection = {
        id: section.id,
        type: section.type,
        enabled: section.enabled,
        content: {
          ...(section.content.eyebrow
            ? { eyebrow: section.content.eyebrow }
            : {}),
          heading: section.content.heading,
          items: section.content.items,
        },
      };
      return normalized;
    }
    case "cta": {
      const normalized: CtaSection = {
        id: section.id,
        type: section.type,
        enabled: section.enabled,
        variant: section.variant,
        content: {
          ...(section.content.eyebrow
            ? { eyebrow: section.content.eyebrow }
            : {}),
          heading: section.content.heading,
          ...(section.content.description
            ? { description: section.content.description }
            : {}),
          primaryAction: normalizeAction(section.content.primaryAction),
          ...(section.content.secondaryAction
            ? {
                secondaryAction: normalizeAction(
                  section.content.secondaryAction,
                ),
              }
            : {}),
        },
      };
      return normalized;
    }
    case "contact": {
      const normalized: ContactSection = {
        id: section.id,
        type: section.type,
        enabled: section.enabled,
        variant: section.variant,
        content: {
          ...(section.content.eyebrow
            ? { eyebrow: section.content.eyebrow }
            : {}),
          heading: section.content.heading,
          ...(section.content.description
            ? { description: section.content.description }
            : {}),
          ...(section.content.phoneLabel
            ? { phoneLabel: section.content.phoneLabel }
            : {}),
          ...(section.content.emailLabel
            ? { emailLabel: section.content.emailLabel }
            : {}),
          ...(section.content.addressLabel
            ? { addressLabel: section.content.addressLabel }
            : {}),
          ...(section.content.hours ? { hours: section.content.hours } : {}),
        },
      };
      return normalized;
    }
    case "footer": {
      const normalized: FooterSection = {
        id: section.id,
        type: section.type,
        enabled: section.enabled,
        variant: section.variant,
        content: {
          ...(section.content.statement
            ? { statement: section.content.statement }
            : {}),
          copyright: section.content.copyright,
          ...(section.content.links
            ? {
                links: section.content.links.map((link) => ({
                  label: link.label,
                  href: normalizeHref(link.href),
                })),
              }
            : {}),
        },
      };
      return normalized;
    }
    default:
      return assertNever(section);
  }
}

export function parseAIWebsiteConfig(input: unknown): WebsiteConfig {
  const parsed = aiWebsiteConfigSchema.parse(normalizeWebsiteConfigInput(input));
  const config: WebsiteConfig = {
    version: parsed.version,
    business: parsed.business,
    theme: {
      style: parsed.theme.style,
      primaryColor: normalizeHexColor(parsed.theme.primaryColor),
      backgroundColor: normalizeHexColor(parsed.theme.backgroundColor),
      textColor: normalizeHexColor(parsed.theme.textColor),
      fontStyle: parsed.theme.fontStyle,
      borderRadius: normalizeBorderRadius(parsed.theme.borderRadius),
      fontPairing: parsed.theme.fontPairing,
      headingScale: parsed.theme.headingScale,
      contentWidth: parsed.theme.contentWidth,
      spacingDensity: parsed.theme.spacingDensity,
      radiusStyle: parsed.theme.radiusStyle,
      borderStyle: parsed.theme.borderStyle,
      surfaceContrast: parsed.theme.surfaceContrast,
      buttonStyle: parsed.theme.buttonStyle,
      navigationStyle: parsed.theme.navigationStyle,
    },
    navigation: parsed.navigation.map((item) => ({
      id: item.id,
      label: item.label,
      href: normalizeHref(item.href),
    })),
    pages: parsed.pages.map((page): WebsitePage => ({
      id: page.id,
      slug: page.slug as WebsiteSlug,
      title: page.title,
      navLabel: page.navLabel,
      enabled: page.enabled,
      sections: page.sections.map((section) => normalizeSection(section) as WebsitePage["sections"][number]),
    })),
    footer: normalizeSection(parsed.footer) as FooterSection,
  };

  const validationErrors = validateWebsiteConfig(config);
  const enabledTypes = new Set(
    config.pages.flatMap((page) => page.sections)
      .filter((section) => section.enabled)
      .map((section) => section.type),
  );

  if (!enabledTypes.has("hero")) {
    validationErrors.push("Generated config requires an enabled hero section.");
  }
  if (!enabledTypes.has("contact")) {
    validationErrors.push("Generated config requires an enabled contact section.");
  }
  if (!config.footer.enabled) {
    validationErrors.push("Generated config requires an enabled footer section.");
  }

  if (validationErrors.length > 0) {
    throw new Error("Generated WebsiteConfig failed application validation.");
  }

  return config;
}

export function parseWebsiteConfigInput(input: unknown): WebsiteConfig {
  return parseAIWebsiteConfig(input);
}
