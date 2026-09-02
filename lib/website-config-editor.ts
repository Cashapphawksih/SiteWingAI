import { validateWebsiteConfig } from "@/lib/website-config";
import { SECTION_VARIANTS, type WebsiteSectionVariant } from "@/lib/website-design-system";
import type {
  WebsiteConfig,
  WebsiteHref,
  WebsiteImageFit,
  WebsiteImageMedia,
  WebsiteMedia,
  WebsitePage,
  WebsiteSection,
  WebsiteSectionType,
} from "@/types/website";
import type {
  EditableField,
  FieldSelection,
  MediaSelection,
  SectionSelection,
  WebsiteSelection,
} from "@/types/website-editor";

export interface EditableFieldDescriptor {
  label: string;
  multiline: boolean;
  maxLength: number;
  inputMode?: "email" | "tel" | "url";
}

export type ConfigEditResult =
  | { ok: true; config: WebsiteConfig }
  | { ok: false; message: string };

const hrefPattern = /^(#[a-z][a-z0-9-]*|\/[a-zA-Z0-9/_-]*|https:\/\/[^\s]+|mailto:[^\s]+|tel:\+?[0-9]+)$/;
const requiredSectionTypes = new Set<WebsiteSectionType>(["footer"]);

const fieldDescriptors: Record<EditableField, EditableFieldDescriptor> = {
  "business.phone": { label: "Phone", multiline: false, maxLength: 160, inputMode: "tel" },
  "business.email": { label: "Email", multiline: false, maxLength: 254, inputMode: "email" },
  "business.location": { label: "Location", multiline: false, maxLength: 160 },
  "navigation.label": { label: "Navigation label", multiline: false, maxLength: 160 },
  "navigation.href": { label: "Destination", multiline: false, maxLength: 500, inputMode: "url" },
  "hero.eyebrow": { label: "Hero eyebrow", multiline: false, maxLength: 160 },
  "hero.heading": { label: "Hero headline", multiline: true, maxLength: 140 },
  "hero.description": { label: "Hero description", multiline: true, maxLength: 520 },
  "hero.primaryAction.label": { label: "Primary button label", multiline: false, maxLength: 160 },
  "hero.primaryAction.href": { label: "Primary button destination", multiline: false, maxLength: 500, inputMode: "url" },
  "hero.secondaryAction.label": { label: "Secondary button label", multiline: false, maxLength: 160 },
  "hero.secondaryAction.href": { label: "Secondary button destination", multiline: false, maxLength: 500, inputMode: "url" },
  "services.eyebrow": { label: "Services eyebrow", multiline: false, maxLength: 160 },
  "services.heading": { label: "Services heading", multiline: true, maxLength: 140 },
  "services.introduction": { label: "Services description", multiline: true, maxLength: 420 },
  "services.service.name": { label: "Service title", multiline: false, maxLength: 160 },
  "services.service.description": { label: "Service description", multiline: true, maxLength: 420 },
  "about.eyebrow": { label: "About eyebrow", multiline: false, maxLength: 160 },
  "about.heading": { label: "About heading", multiline: true, maxLength: 140 },
  "about.body": { label: "About body copy", multiline: true, maxLength: 1200 },
  "testimonials.eyebrow": { label: "Testimonials eyebrow", multiline: false, maxLength: 160 },
  "testimonials.heading": { label: "Testimonials heading", multiline: true, maxLength: 140 },
  "testimonials.testimonial.quote": { label: "Testimonial quote", multiline: true, maxLength: 520 },
  "testimonials.testimonial.name": { label: "Testimonial author", multiline: false, maxLength: 160 },
  "faq.eyebrow": { label: "FAQ eyebrow", multiline: false, maxLength: 160 },
  "faq.heading": { label: "FAQ heading", multiline: true, maxLength: 140 },
  "faq.item.question": { label: "FAQ question", multiline: true, maxLength: 220 },
  "faq.item.answer": { label: "FAQ answer", multiline: true, maxLength: 700 },
  "cta.eyebrow": { label: "CTA eyebrow", multiline: false, maxLength: 160 },
  "cta.heading": { label: "CTA heading", multiline: true, maxLength: 140 },
  "cta.description": { label: "CTA description", multiline: true, maxLength: 420 },
  "cta.primaryAction.label": { label: "Primary button label", multiline: false, maxLength: 160 },
  "cta.primaryAction.href": { label: "Primary button destination", multiline: false, maxLength: 500, inputMode: "url" },
  "cta.secondaryAction.label": { label: "Secondary button label", multiline: false, maxLength: 160 },
  "cta.secondaryAction.href": { label: "Secondary button destination", multiline: false, maxLength: 500, inputMode: "url" },
  "contact.eyebrow": { label: "Contact eyebrow", multiline: false, maxLength: 160 },
  "contact.heading": { label: "Contact heading", multiline: true, maxLength: 140 },
  "contact.description": { label: "Contact description", multiline: true, maxLength: 420 },
  "footer.statement": { label: "Footer statement", multiline: true, maxLength: 160 },
  "footer.copyright": { label: "Copyright", multiline: false, maxLength: 160 },
};

export function getEditableFieldDescriptor(field: EditableField): EditableFieldDescriptor {
  return fieldDescriptors[field];
}

export function getCompanionHrefSelection(selection: FieldSelection): FieldSelection | null {
  const pairs: Partial<Record<EditableField, EditableField>> = {
    "navigation.label": "navigation.href",
    "hero.primaryAction.label": "hero.primaryAction.href",
    "hero.secondaryAction.label": "hero.secondaryAction.href",
    "cta.primaryAction.label": "cta.primaryAction.href",
    "cta.secondaryAction.label": "cta.secondaryAction.href",
  };
  const field = pairs[selection.field];
  return field ? { ...selection, field } : null;
}

export function getSelectionKey(selection: WebsiteSelection): string {
  if (selection.kind === "section") return `section:${selection.pageId ?? ""}:${selection.sectionId}`;
  if (selection.kind === "media") {
    return ["media", selection.pageId ?? "", selection.field, selection.sectionId, selection.itemId ?? ""].join(":");
  }
  return [
    "field",
    selection.pageId ?? "",
    selection.field,
    selection.sectionId ?? "",
    selection.itemId ?? "",
    selection.itemIndex ?? "",
  ].join(":");
}

export function parseSelectionKey(key: string): WebsiteSelection | null {
  const parts = key.split(":");
  if (parts[0] === "section" && parts.length === 3 && parts[2]) {
    return { kind: "section", pageId: parts[1] || undefined, sectionId: parts[2] };
  }
  if (
    parts[0] === "media" &&
    parts.length === 5 &&
    (parts[2] === "hero.media" || parts[2] === "gallery.item.media") &&
    parts[3]
  ) {
    return {
      kind: "media",
      pageId: parts[1] || undefined,
      field: parts[2],
      sectionId: parts[3],
      itemId: parts[4] || undefined,
    };
  }
  if (parts[0] !== "field" || parts.length !== 6 || !(parts[2] in fieldDescriptors)) return null;
  const itemIndex = parts[5] === "" ? undefined : Number(parts[5]);
  if (itemIndex !== undefined && !Number.isInteger(itemIndex)) return null;
  return {
    kind: "field",
    pageId: parts[1] || undefined,
    field: parts[2] as EditableField,
    sectionId: parts[3] || undefined,
    itemId: parts[4] || undefined,
    itemIndex,
  };
}

export function sectionSelection(sectionId: string): SectionSelection {
  return { kind: "section", sectionId };
}

export function fieldSelection(
  field: EditableField,
  options: Omit<FieldSelection, "kind" | "field"> = {},
): FieldSelection {
  return { kind: "field", field, ...options };
}

function findSection<TType extends Exclude<WebsiteSectionType, "footer">>(
  config: WebsiteConfig,
  id: string | undefined,
  type: TType,
): Extract<WebsiteSection, { type: TType }> | undefined {
  return config.pages.flatMap((page) => page.sections).find(
    (section): section is Extract<WebsiteSection, { type: TType }> =>
      section.id === id && section.type === type,
  );
}

function validHref(value: string): WebsiteHref | null {
  return hrefPattern.test(value) ? (value as WebsiteHref) : null;
}

function rejectInvalidConfig(config: WebsiteConfig): ConfigEditResult {
  const errors = validateWebsiteConfig(config);
  return errors.length === 0
    ? { ok: true, config }
    : { ok: false, message: errors[0] };
}

export interface MediaDetailsUpdate {
  alt: string;
  fit: WebsiteImageFit;
  title?: string;
  category?: string;
}

function findSelectedMediaTarget(config: WebsiteConfig, selection: MediaSelection) {
  const page = config.pages.find((candidate) => candidate.id === selection.pageId);
  if (!page) return null;
  if (selection.field === "hero.media") {
    const section = page.sections.find((candidate) => candidate.id === selection.sectionId && candidate.type === "hero");
    return section?.type === "hero" ? { page, section, item: undefined } : null;
  }
  const section = page.sections.find((candidate) => candidate.id === selection.sectionId && candidate.type === "gallery");
  if (section?.type !== "gallery") return null;
  const item = section.content.items.find((candidate) => candidate.id === selection.itemId);
  return item ? { page, section, item } : null;
}

export function getSelectedMedia(config: WebsiteConfig, selection: MediaSelection): WebsiteMedia | null {
  const target = findSelectedMediaTarget(config, selection);
  if (!target) return null;
  return target.item ? target.item.media : target.section.type === "hero" ? target.section.content.media ?? null : null;
}

export function replaceSelectedMedia(config: WebsiteConfig, selection: MediaSelection, media: WebsiteMedia): ConfigEditResult {
  const next = structuredClone(config);
  const target = findSelectedMediaTarget(next, selection);
  if (!target) return { ok: false, message: "That media slot no longer exists." };
  if (target.item) target.item.media = media;
  else if (target.section.type === "hero") target.section.content.media = media;
  return rejectInvalidConfig(next);
}

export function updateSelectedMediaDetails(config: WebsiteConfig, selection: MediaSelection, details: MediaDetailsUpdate): ConfigEditResult {
  const alt = details.alt.trim();
  if (!alt) return { ok: false, message: "Alt text cannot be empty." };
  if (alt.length > 500) return { ok: false, message: "Alt text must be 500 characters or fewer." };
  const next = structuredClone(config);
  const target = findSelectedMediaTarget(next, selection);
  if (!target) return { ok: false, message: "That media slot no longer exists." };
  const media = target.item ? target.item.media : target.section.type === "hero" ? target.section.content.media : undefined;
  if (!media || media.kind !== "image") return { ok: false, message: "Upload an image before editing its alt text." };
  const updated: WebsiteImageMedia = { ...media, alt, fit: details.fit };
  if (target.item) {
    const title = details.title?.trim();
    if (!title) return { ok: false, message: "Gallery captions cannot be empty." };
    if (title.length > 160) return { ok: false, message: "Gallery captions must be 160 characters or fewer." };
    target.item.media = updated;
    target.item.title = title;
    const category = details.category?.trim();
    if (category) target.item.category = category;
    else delete target.item.category;
  } else if (target.section.type === "hero") {
    target.section.content.media = updated;
  }
  return rejectInvalidConfig(next);
}

export function removeSelectedMedia(config: WebsiteConfig, selection: MediaSelection): ConfigEditResult {
  const next = structuredClone(config);
  const target = findSelectedMediaTarget(next, selection);
  if (!target) return { ok: false, message: "That media slot no longer exists." };
  if (target.item && target.section.type === "gallery") {
    if (target.section.content.items.length === 1) {
      return { ok: false, message: "A gallery must keep at least one item." };
    }
    target.section.content.items = target.section.content.items.filter((item) => item.id !== target.item?.id);
  } else if (target.section.type === "hero") {
    const current = target.section.content.media;
    target.section.content.media = {
      kind: "placeholder",
      label: current?.kind === "image" ? current.alt : current?.label ?? "Hero image",
    };
  }
  return rejectInvalidConfig(next);
}

export function moveSelectedGalleryItem(config: WebsiteConfig, selection: MediaSelection, direction: -1 | 1): ConfigEditResult {
  if (selection.field !== "gallery.item.media") return { ok: false, message: "Only gallery items can be reordered." };
  const next = structuredClone(config);
  const target = findSelectedMediaTarget(next, selection);
  if (!target?.item || target.section.type !== "gallery") return { ok: false, message: "That gallery item no longer exists." };
  const index = target.section.content.items.findIndex((item) => item.id === target.item?.id);
  const destination = index + direction;
  if (destination < 0 || destination >= target.section.content.items.length) return { ok: false, message: "That gallery item cannot move any farther." };
  const [item] = target.section.content.items.splice(index, 1);
  target.section.content.items.splice(destination, 0, item);
  return rejectInvalidConfig(next);
}

export function getSelectedFieldValue(config: WebsiteConfig, selection: FieldSelection): string | null {
  const sectionId = selection.sectionId;
  switch (selection.field) {
    case "business.phone": return config.business.phone;
    case "business.email": return config.business.email;
    case "business.location": return config.business.location;
    case "navigation.label": return config.navigation.find((item) => item.id === selection.itemId)?.label ?? null;
    case "navigation.href": return config.navigation.find((item) => item.id === selection.itemId)?.href ?? null;
    case "hero.eyebrow": return findSection(config, sectionId, "hero")?.content.eyebrow ?? null;
    case "hero.heading": return findSection(config, sectionId, "hero")?.content.heading ?? null;
    case "hero.description": return findSection(config, sectionId, "hero")?.content.description ?? null;
    case "hero.primaryAction.label": return findSection(config, sectionId, "hero")?.content.primaryAction.label ?? null;
    case "hero.primaryAction.href": return findSection(config, sectionId, "hero")?.content.primaryAction.href ?? null;
    case "hero.secondaryAction.label": return findSection(config, sectionId, "hero")?.content.secondaryAction?.label ?? null;
    case "hero.secondaryAction.href": return findSection(config, sectionId, "hero")?.content.secondaryAction?.href ?? null;
    case "services.eyebrow": return findSection(config, sectionId, "services")?.content.eyebrow ?? null;
    case "services.heading": return findSection(config, sectionId, "services")?.content.heading ?? null;
    case "services.introduction": return findSection(config, sectionId, "services")?.content.introduction ?? null;
    case "services.service.name": return findSection(config, sectionId, "services")?.content.services.find((item) => item.id === selection.itemId)?.name ?? null;
    case "services.service.description": return findSection(config, sectionId, "services")?.content.services.find((item) => item.id === selection.itemId)?.description ?? null;
    case "about.eyebrow": return findSection(config, sectionId, "about")?.content.eyebrow ?? null;
    case "about.heading": return findSection(config, sectionId, "about")?.content.heading ?? null;
    case "about.body": return findSection(config, sectionId, "about")?.content.body[selection.itemIndex ?? -1] ?? null;
    case "testimonials.eyebrow": return findSection(config, sectionId, "testimonials")?.content.eyebrow ?? null;
    case "testimonials.heading": return findSection(config, sectionId, "testimonials")?.content.heading ?? null;
    case "testimonials.testimonial.quote": return findSection(config, sectionId, "testimonials")?.content.testimonials.find((item) => item.id === selection.itemId)?.quote ?? null;
    case "testimonials.testimonial.name": return findSection(config, sectionId, "testimonials")?.content.testimonials.find((item) => item.id === selection.itemId)?.name ?? null;
    case "faq.eyebrow": return findSection(config, sectionId, "faq")?.content.eyebrow ?? null;
    case "faq.heading": return findSection(config, sectionId, "faq")?.content.heading ?? null;
    case "faq.item.question": return findSection(config, sectionId, "faq")?.content.items.find((item) => item.id === selection.itemId)?.question ?? null;
    case "faq.item.answer": return findSection(config, sectionId, "faq")?.content.items.find((item) => item.id === selection.itemId)?.answer ?? null;
    case "cta.eyebrow": return findSection(config, sectionId, "cta")?.content.eyebrow ?? null;
    case "cta.heading": return findSection(config, sectionId, "cta")?.content.heading ?? null;
    case "cta.description": return findSection(config, sectionId, "cta")?.content.description ?? null;
    case "cta.primaryAction.label": return findSection(config, sectionId, "cta")?.content.primaryAction.label ?? null;
    case "cta.primaryAction.href": return findSection(config, sectionId, "cta")?.content.primaryAction.href ?? null;
    case "cta.secondaryAction.label": return findSection(config, sectionId, "cta")?.content.secondaryAction?.label ?? null;
    case "cta.secondaryAction.href": return findSection(config, sectionId, "cta")?.content.secondaryAction?.href ?? null;
    case "contact.eyebrow": return findSection(config, sectionId, "contact")?.content.eyebrow ?? null;
    case "contact.heading": return findSection(config, sectionId, "contact")?.content.heading ?? null;
    case "contact.description": return findSection(config, sectionId, "contact")?.content.description ?? null;
    case "footer.statement": return config.footer.content.statement ?? null;
    case "footer.copyright": return config.footer.content.copyright;
  }
}

export function updateSelectedField(config: WebsiteConfig, selection: FieldSelection, rawValue: string): ConfigEditResult {
  const descriptor = getEditableFieldDescriptor(selection.field);
  const value = rawValue.trim();
  if (!value) return { ok: false, message: `${descriptor.label} cannot be empty.` };
  if (value.length > descriptor.maxLength) return { ok: false, message: `${descriptor.label} must be ${descriptor.maxLength} characters or fewer.` };
  const next = structuredClone(config);
  const href = selection.field.endsWith(".href") ? validHref(value) : null;
  if (selection.field.endsWith(".href") && !href) {
    return { ok: false, message: "Use a section anchor, site path, HTTPS URL, email link, or phone link." };
  }
  if (selection.field === "business.email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return { ok: false, message: "Enter a valid email address." };
  }

  const sectionId = selection.sectionId;
  switch (selection.field) {
    case "business.phone": next.business.phone = value; break;
    case "business.email": next.business.email = value; break;
    case "business.location": next.business.location = value; break;
    case "navigation.label": { const item = next.navigation.find((entry) => entry.id === selection.itemId); if (!item) return { ok: false, message: "That navigation item no longer exists." }; item.label = value; break; }
    case "navigation.href": { const item = next.navigation.find((entry) => entry.id === selection.itemId); if (!item || !href) return { ok: false, message: "That navigation item no longer exists." }; item.href = href; break; }
    case "hero.eyebrow": { const section = findSection(next, sectionId, "hero"); if (!section) break; section.content.eyebrow = value; break; }
    case "hero.heading": { const section = findSection(next, sectionId, "hero"); if (!section) break; section.content.heading = value; break; }
    case "hero.description": { const section = findSection(next, sectionId, "hero"); if (!section) break; section.content.description = value; break; }
    case "hero.primaryAction.label": { const section = findSection(next, sectionId, "hero"); if (!section) break; section.content.primaryAction.label = value; break; }
    case "hero.primaryAction.href": { const section = findSection(next, sectionId, "hero"); if (!section || !href) break; section.content.primaryAction.href = href; break; }
    case "hero.secondaryAction.label": { const section = findSection(next, sectionId, "hero"); if (!section?.content.secondaryAction) break; section.content.secondaryAction.label = value; break; }
    case "hero.secondaryAction.href": { const section = findSection(next, sectionId, "hero"); if (!section?.content.secondaryAction || !href) break; section.content.secondaryAction.href = href; break; }
    case "services.eyebrow": { const section = findSection(next, sectionId, "services"); if (!section) break; section.content.eyebrow = value; break; }
    case "services.heading": { const section = findSection(next, sectionId, "services"); if (!section) break; section.content.heading = value; break; }
    case "services.introduction": { const section = findSection(next, sectionId, "services"); if (!section) break; section.content.introduction = value; break; }
    case "services.service.name": { const item = findSection(next, sectionId, "services")?.content.services.find((entry) => entry.id === selection.itemId); if (!item) break; item.name = value; break; }
    case "services.service.description": { const item = findSection(next, sectionId, "services")?.content.services.find((entry) => entry.id === selection.itemId); if (!item) break; item.description = value; break; }
    case "about.eyebrow": { const section = findSection(next, sectionId, "about"); if (!section) break; section.content.eyebrow = value; break; }
    case "about.heading": { const section = findSection(next, sectionId, "about"); if (!section) break; section.content.heading = value; break; }
    case "about.body": { const section = findSection(next, sectionId, "about"); const index = selection.itemIndex ?? -1; if (!section?.content.body[index]) break; section.content.body[index] = value; break; }
    case "testimonials.eyebrow": { const section = findSection(next, sectionId, "testimonials"); if (!section) break; section.content.eyebrow = value; break; }
    case "testimonials.heading": { const section = findSection(next, sectionId, "testimonials"); if (!section) break; section.content.heading = value; break; }
    case "testimonials.testimonial.quote": { const item = findSection(next, sectionId, "testimonials")?.content.testimonials.find((entry) => entry.id === selection.itemId); if (!item) break; item.quote = value; break; }
    case "testimonials.testimonial.name": { const item = findSection(next, sectionId, "testimonials")?.content.testimonials.find((entry) => entry.id === selection.itemId); if (!item) break; item.name = value; break; }
    case "faq.eyebrow": { const section = findSection(next, sectionId, "faq"); if (!section) break; section.content.eyebrow = value; break; }
    case "faq.heading": { const section = findSection(next, sectionId, "faq"); if (!section) break; section.content.heading = value; break; }
    case "faq.item.question": { const item = findSection(next, sectionId, "faq")?.content.items.find((entry) => entry.id === selection.itemId); if (!item) break; item.question = value; break; }
    case "faq.item.answer": { const item = findSection(next, sectionId, "faq")?.content.items.find((entry) => entry.id === selection.itemId); if (!item) break; item.answer = value; break; }
    case "cta.eyebrow": { const section = findSection(next, sectionId, "cta"); if (!section) break; section.content.eyebrow = value; break; }
    case "cta.heading": { const section = findSection(next, sectionId, "cta"); if (!section) break; section.content.heading = value; break; }
    case "cta.description": { const section = findSection(next, sectionId, "cta"); if (!section) break; section.content.description = value; break; }
    case "cta.primaryAction.label": { const section = findSection(next, sectionId, "cta"); if (!section) break; section.content.primaryAction.label = value; break; }
    case "cta.primaryAction.href": { const section = findSection(next, sectionId, "cta"); if (!section || !href) break; section.content.primaryAction.href = href; break; }
    case "cta.secondaryAction.label": { const section = findSection(next, sectionId, "cta"); if (!section?.content.secondaryAction) break; section.content.secondaryAction.label = value; break; }
    case "cta.secondaryAction.href": { const section = findSection(next, sectionId, "cta"); if (!section?.content.secondaryAction || !href) break; section.content.secondaryAction.href = href; break; }
    case "contact.eyebrow": { const section = findSection(next, sectionId, "contact"); if (!section) break; section.content.eyebrow = value; break; }
    case "contact.heading": { const section = findSection(next, sectionId, "contact"); if (!section) break; section.content.heading = value; break; }
    case "contact.description": { const section = findSection(next, sectionId, "contact"); if (!section) break; section.content.description = value; break; }
    case "footer.statement": next.footer.content.statement = value; break;
    case "footer.copyright": next.footer.content.copyright = value; break;
  }
  if (getSelectedFieldValue(next, selection) !== value) return { ok: false, message: "That field no longer exists." };
  return rejectInvalidConfig(next);
}

export function moveSection(config: WebsiteConfig, pageId: string, sectionId: string, direction: -1 | 1): ConfigEditResult {
  const page = config.pages.find((candidate) => candidate.id === pageId);
  if (!page) return { ok: false, message: "That page no longer exists." };
  const index = page.sections.findIndex((section) => section.id === sectionId);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= page.sections.length) return { ok: false, message: "That section cannot move any farther." };
  const next = structuredClone(config);
  const nextPage = next.pages.find((candidate) => candidate.id === pageId);
  if (!nextPage) return { ok: false, message: "That page no longer exists." };
  const [section] = nextPage.sections.splice(index, 1);
  nextPage.sections.splice(target, 0, section);
  return rejectInvalidConfig(next);
}

export function setSectionEnabled(config: WebsiteConfig, pageId: string, sectionId: string, enabled: boolean): ConfigEditResult {
  if (sectionId === config.footer.id) return { ok: false, message: "The global footer is required and cannot be hidden." };
  const page = config.pages.find((candidate) => candidate.id === pageId);
  const existing = page?.sections.find((section) => section.id === sectionId);
  if (!existing) return { ok: false, message: "That section no longer exists." };
  if (!enabled) {
    const target = `#${sectionId}`;
    const linkedByAction = config.pages.flatMap((candidate) => candidate.sections).some((section) => {
      if (section.type !== "hero" && section.type !== "cta") return false;
      return section.content.primaryAction.href === target || section.content.secondaryAction?.href === target;
    });
    if (linkedByAction) return { ok: false, message: "Update the button that links to this section before hiding it." };
  }
  const next = structuredClone(config);
  const nextPage = next.pages.find((candidate) => candidate.id === pageId);
  const section = nextPage?.sections.find((entry) => entry.id === sectionId);
  if (!section) return { ok: false, message: "That section no longer exists." };
  section.enabled = enabled;
  if (!enabled) {
    const target = `#${sectionId}`;
    next.navigation = next.navigation.filter((item) => item.href !== target);
    if (next.footer.content.links) {
      next.footer.content.links = next.footer.content.links.filter((link) => link.href !== target);
    }
  }
  return rejectInvalidConfig(next);
}

function sectionWithVariant(section: WebsiteSection, variant: WebsiteSectionVariant): WebsiteSection | null {
  switch (section.type) {
    case "hero":
      return (SECTION_VARIANTS.hero as readonly string[]).includes(variant) ? { ...section, variant: variant as typeof section.variant } : null;
    case "services":
      return (SECTION_VARIANTS.services as readonly string[]).includes(variant) ? { ...section, variant: variant as typeof section.variant } : null;
    case "about":
      return (SECTION_VARIANTS.about as readonly string[]).includes(variant) ? { ...section, variant: variant as typeof section.variant } : null;
    case "gallery":
      return (SECTION_VARIANTS.gallery as readonly string[]).includes(variant) ? { ...section, variant: variant as typeof section.variant } : null;
    case "testimonials":
      return (SECTION_VARIANTS.testimonials as readonly string[]).includes(variant) ? { ...section, variant: variant as typeof section.variant } : null;
    case "cta":
      return (SECTION_VARIANTS.cta as readonly string[]).includes(variant) ? { ...section, variant: variant as typeof section.variant } : null;
    case "contact":
      return (SECTION_VARIANTS.contact as readonly string[]).includes(variant) ? { ...section, variant: variant as typeof section.variant } : null;
    case "footer":
      return (SECTION_VARIANTS.footer as readonly string[]).includes(variant) ? { ...section, variant: variant as typeof section.variant } : null;
    case "faq":
      return null;
  }
}

export function updateSectionVariant(
  config: WebsiteConfig,
  pageId: string | undefined,
  sectionId: string,
  variant: WebsiteSectionVariant,
): ConfigEditResult {
  const next = structuredClone(config);
  if (sectionId === next.footer.id) {
    const updated = sectionWithVariant(next.footer, variant);
    if (!updated || updated.type !== "footer") return { ok: false, message: "That layout is not supported by this section." };
    next.footer = updated;
    return rejectInvalidConfig(next);
  }
  const page = next.pages.find((candidate) => candidate.id === pageId);
  const index = page?.sections.findIndex((section) => section.id === sectionId) ?? -1;
  if (!page || index < 0) return { ok: false, message: "That section no longer exists." };
  const updated = sectionWithVariant(page.sections[index], variant);
  if (!updated || updated.type === "footer") return { ok: false, message: "That layout is not supported by this section." };
  page.sections[index] = updated;
  return rejectInvalidConfig(next);
}

export function selectionExists(config: WebsiteConfig, selection: WebsiteSelection): boolean {
  if (selection.kind === "section") {
    if (selection.sectionId === config.footer.id) return true;
    return config.pages.find((page) => page.id === selection.pageId)?.sections.some((section) => section.id === selection.sectionId) ?? false;
  }
  if (selection.kind === "media") return getSelectedMedia(config, selection) !== null;
  const valueExists = getSelectedFieldValue(config, selection) !== null;
  if (!valueExists) return false;
  if (!selection.sectionId) return true;
  if (selection.sectionId === config.footer.id) return config.footer.enabled;
  return config.pages.find((page) => page.id === selection.pageId)?.sections.some((section) => section.id === selection.sectionId && section.enabled) ?? false;
}

export function isRequiredSection(section: WebsiteSection): boolean {
  return requiredSectionTypes.has(section.type);
}

function slugifyPage(value: string): string {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) || "page";
}

export function updatePageMetadata(config: WebsiteConfig, pageId: string, title: string, navLabel: string): ConfigEditResult {
  const cleanTitle = title.trim();
  const cleanNavLabel = navLabel.trim();
  if (!cleanTitle || !cleanNavLabel) return { ok: false, message: "Page title and navigation label cannot be empty." };
  if (cleanTitle.length > 160 || cleanNavLabel.length > 160) return { ok: false, message: "Page labels must be 160 characters or fewer." };
  const next = structuredClone(config);
  const page = next.pages.find((candidate) => candidate.id === pageId);
  if (!page) return { ok: false, message: "That page no longer exists." };
  page.title = cleanTitle;
  page.navLabel = cleanNavLabel;
  for (const item of next.navigation) if (item.href === page.slug) item.label = cleanNavLabel;
  return rejectInvalidConfig(next);
}

export function movePage(config: WebsiteConfig, pageId: string, direction: -1 | 1): ConfigEditResult {
  const index = config.pages.findIndex((page) => page.id === pageId);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= config.pages.length) return { ok: false, message: "That page cannot move any farther." };
  const next = structuredClone(config);
  const [page] = next.pages.splice(index, 1);
  next.pages.splice(target, 0, page);
  const pageLinks = new Set<string>(next.pages.map((candidate) => candidate.slug));
  const external = next.navigation.filter((item) => !pageLinks.has(item.href));
  next.navigation = [...next.pages.filter((candidate) => candidate.enabled).map((candidate) => ({ id: `nav-${candidate.id}`, label: candidate.navLabel, href: candidate.slug })), ...external];
  return rejectInvalidConfig(next);
}

export function setPageEnabled(config: WebsiteConfig, pageId: string, enabled: boolean): ConfigEditResult {
  const existing = config.pages.find((page) => page.id === pageId);
  if (!existing) return { ok: false, message: "That page no longer exists." };
  if (existing.slug === "/" && !enabled) return { ok: false, message: "The Home page cannot be hidden." };
  const next = structuredClone(config);
  const page = next.pages.find((candidate) => candidate.id === pageId);
  if (!page) return { ok: false, message: "That page no longer exists." };
  page.enabled = enabled;
  next.navigation = next.navigation.filter((item) => item.href !== page.slug);
  if (enabled) next.navigation.push({ id: `nav-${page.id}`, label: page.navLabel, href: page.slug });
  if (!enabled && next.footer.content.links) next.footer.content.links = next.footer.content.links.filter((link) => link.href !== page.slug);
  return rejectInvalidConfig(next);
}

export function addBasicPage(config: WebsiteConfig, name: string): ConfigEditResult {
  const title = name.trim();
  if (!title) return { ok: false, message: "Enter a page name." };
  const base = slugifyPage(title);
  let id = base;
  let suffix = 2;
  while (config.pages.some((page) => page.id === id || page.slug === `/${id}`)) id = `${base}-${suffix++}`;
  const page: WebsitePage = {
    id,
    slug: `/${id}`,
    title,
    navLabel: title,
    enabled: true,
    sections: [{
      id: `${id}-content`,
      type: "about",
      enabled: true,
      content: { eyebrow: title, heading: title, body: [`Add the essential ${title.toLowerCase()} information for this business.`] },
    }],
  };
  const next = structuredClone(config);
  next.pages.push(page);
  next.navigation.push({ id: `nav-${id}`, label: title, href: page.slug });
  return rejectInvalidConfig(next);
}

export function removePage(config: WebsiteConfig, pageId: string): ConfigEditResult {
  const page = config.pages.find((candidate) => candidate.id === pageId);
  if (!page) return { ok: false, message: "That page no longer exists." };
  if (page.slug === "/") return { ok: false, message: "The Home page cannot be removed." };
  const linkedByAction = config.pages.flatMap((candidate) => candidate.sections).some((section) => (section.type === "hero" || section.type === "cta") && (section.content.primaryAction.href === page.slug || section.content.secondaryAction?.href === page.slug));
  if (linkedByAction) return { ok: false, message: "Update buttons that link to this page before removing it." };
  const next = structuredClone(config);
  next.pages = next.pages.filter((candidate) => candidate.id !== pageId);
  next.navigation = next.navigation.filter((item) => item.href !== page.slug);
  if (next.footer.content.links) next.footer.content.links = next.footer.content.links.filter((link) => link.href !== page.slug);
  return rejectInvalidConfig(next);
}
