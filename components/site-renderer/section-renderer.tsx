import type { BusinessDetails, WebsiteSection } from "@/types/website";
import type { RendererEditorState } from "@/types/website-editor";

import { AboutSectionComponent } from "./sections/about-section";
import { ContactSectionComponent } from "./sections/contact-section";
import { CtaSectionComponent } from "./sections/cta-section";
import { FaqSectionComponent } from "./sections/faq-section";
import { FooterSectionComponent } from "./sections/footer-section";
import { GallerySectionComponent } from "./sections/gallery-section";
import { HeroSectionComponent } from "./sections/hero-section";
import { ServicesSectionComponent } from "./sections/services-section";
import { TestimonialsSectionComponent } from "./sections/testimonials-section";

interface SectionRendererProps {
  section: WebsiteSection;
  business: BusinessDetails;
  editor?: RendererEditorState;
  publicBasePath?: string;
  publicPageSlug?: string;
}

function assertNever(section: never): never {
  throw new Error(`Unsupported website section: ${JSON.stringify(section)}`);
}

export function SectionRenderer({
  section,
  business,
  editor,
  publicBasePath,
  publicPageSlug,
}: SectionRendererProps) {
  switch (section.type) {
    case "hero":
      return <HeroSectionComponent section={section} editor={editor} publicBasePath={publicBasePath} publicPageSlug={publicPageSlug} />;
    case "services":
      return <ServicesSectionComponent section={section} editor={editor} />;
    case "about":
      return <AboutSectionComponent section={section} editor={editor} />;
    case "gallery":
      return <GallerySectionComponent section={section} editor={editor} />;
    case "testimonials":
      return <TestimonialsSectionComponent section={section} editor={editor} />;
    case "faq":
      return <FaqSectionComponent section={section} editor={editor} />;
    case "cta":
      return <CtaSectionComponent section={section} editor={editor} publicBasePath={publicBasePath} publicPageSlug={publicPageSlug} />;
    case "contact":
      return <ContactSectionComponent section={section} business={business} editor={editor} />;
    case "footer":
      return <FooterSectionComponent section={section} business={business} editor={editor} publicBasePath={publicBasePath} />;
    default:
      return assertNever(section);
  }
}
