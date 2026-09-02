export type EditableField =
  | "business.phone"
  | "business.email"
  | "business.location"
  | "navigation.label"
  | "navigation.href"
  | "hero.eyebrow"
  | "hero.heading"
  | "hero.description"
  | "hero.primaryAction.label"
  | "hero.primaryAction.href"
  | "hero.secondaryAction.label"
  | "hero.secondaryAction.href"
  | "services.eyebrow"
  | "services.heading"
  | "services.introduction"
  | "services.service.name"
  | "services.service.description"
  | "about.eyebrow"
  | "about.heading"
  | "about.body"
  | "testimonials.eyebrow"
  | "testimonials.heading"
  | "testimonials.testimonial.quote"
  | "testimonials.testimonial.name"
  | "faq.eyebrow"
  | "faq.heading"
  | "faq.item.question"
  | "faq.item.answer"
  | "cta.eyebrow"
  | "cta.heading"
  | "cta.description"
  | "cta.primaryAction.label"
  | "cta.primaryAction.href"
  | "cta.secondaryAction.label"
  | "cta.secondaryAction.href"
  | "contact.eyebrow"
  | "contact.heading"
  | "contact.description"
  | "footer.statement"
  | "footer.copyright";

interface SelectionBase {
  pageId?: string;
}

export interface SectionSelection extends SelectionBase {
  kind: "section";
  sectionId: string;
}

export interface FieldSelection extends SelectionBase {
  kind: "field";
  field: EditableField;
  sectionId?: string;
  itemId?: string;
  itemIndex?: number;
}

export type EditableMediaField = "hero.media" | "gallery.item.media";

export interface MediaSelection extends SelectionBase {
  kind: "media";
  field: EditableMediaField;
  sectionId: string;
  itemId?: string;
}

export type WebsiteSelection = SectionSelection | FieldSelection | MediaSelection;

export interface RendererEditorState {
  enabled: boolean;
  pageId: string;
  selectedKey?: string;
}
