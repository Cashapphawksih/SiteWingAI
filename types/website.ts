export type HexColor = `#${string}`;
export type BorderRadius = `${number}px`;

export type WebsiteThemeStyle =
  | "minimal"
  | "editorial"
  | "professional"
  | "automotive";

export type WebsiteFontStyle = "sans" | "serif" | "condensed";

export type WebsiteFontPairing =
  | "modern-sans"
  | "editorial-serif"
  | "classic-serif"
  | "condensed-impact"
  | "humanist-sans";
export type WebsiteHeadingScale = "compact" | "balanced" | "display";
export type WebsiteContentWidth = "narrow" | "standard" | "wide";
export type WebsiteSpacingDensity = "compact" | "comfortable" | "generous";
export type WebsiteRadiusStyle = "square" | "subtle" | "rounded";
export type WebsiteBorderStyle = "none" | "subtle" | "strong";
export type WebsiteSurfaceContrast = "flat" | "layered" | "high";
export type WebsiteButtonStyle = "solid" | "outline" | "pill";
export type WebsiteNavigationStyle =
  | "minimal"
  | "centered"
  | "classic"
  | "transparent";

export type WebsiteHref =
  | `#${string}`
  | `/${string}`
  | `https://${string}`
  | `mailto:${string}`
  | `tel:${string}`;

export interface BusinessDetails {
  name: string;
  tagline: string;
  phone: string;
  email: string;
  location: string;
}

export interface WebsiteTheme {
  style: WebsiteThemeStyle;
  primaryColor: HexColor;
  backgroundColor: HexColor;
  textColor: HexColor;
  fontStyle: WebsiteFontStyle;
  borderRadius: BorderRadius;
  fontPairing?: WebsiteFontPairing;
  headingScale?: WebsiteHeadingScale;
  contentWidth?: WebsiteContentWidth;
  spacingDensity?: WebsiteSpacingDensity;
  radiusStyle?: WebsiteRadiusStyle;
  borderStyle?: WebsiteBorderStyle;
  surfaceContrast?: WebsiteSurfaceContrast;
  buttonStyle?: WebsiteButtonStyle;
  navigationStyle?: WebsiteNavigationStyle;
}

export type HeroLayoutVariant =
  | "split"
  | "centered"
  | "editorial"
  | "image-led"
  | "minimal"
  | "bold-service";
export type ServicesLayoutVariant =
  | "grid"
  | "numbered-list"
  | "alternating"
  | "cards"
  | "editorial-list";
export type AboutLayoutVariant =
  | "split-media"
  | "editorial"
  | "stats-led"
  | "minimal";
export type GalleryLayoutVariant =
  | "grid"
  | "masonry-like"
  | "featured-first"
  | "horizontal-editorial";
export type TestimonialsLayoutVariant =
  | "cards"
  | "quote-feature"
  | "compact-grid";
export type CtaLayoutVariant = "centered" | "split" | "banner" | "minimal";
export type ContactLayoutVariant = "split" | "card" | "minimal" | "details-first";
export type FooterLayoutVariant = "compact" | "multi-column" | "editorial";

export interface NavigationItem {
  id: string;
  label: string;
  href: WebsiteHref;
}

export interface WebsiteAction {
  label: string;
  href: WebsiteHref;
  accessibleLabel?: string;
}

export type WebsiteImageFit = "cover" | "contain";
export type WebsiteImageSource = "remote" | "temporary" | "storage";
export type WebsiteImageMimeType = "image/jpeg" | "image/png" | "image/webp";

export interface WebsiteImageMedia {
  kind: "image";
  src: string;
  alt: string;
  source?: WebsiteImageSource;
  storagePath?: string;
  mimeType?: WebsiteImageMimeType;
  width?: number;
  height?: number;
  fit?: WebsiteImageFit;
}

export type WebsiteMedia =
  | WebsiteImageMedia
  | {
      kind: "placeholder";
      label: string;
    };

interface SectionBase<TType extends WebsiteSectionType> {
  id: string;
  type: TType;
  enabled: boolean;
}

export interface HeroSection
  extends SectionBase<"hero"> {
  variant?: HeroLayoutVariant;
  content: {
    eyebrow?: string;
    heading: string;
    description: string;
    primaryAction: WebsiteAction;
    secondaryAction?: WebsiteAction;
    proofPoints?: string[];
    media?: WebsiteMedia;
  };
}

export interface ServiceItem {
  id: string;
  number?: string;
  name: string;
  description: string;
  detail?: string;
}

export interface ServicesSection
  extends SectionBase<"services"> {
  variant?: ServicesLayoutVariant;
  content: {
    eyebrow?: string;
    heading: string;
    introduction?: string;
    services: ServiceItem[];
  };
}

export interface AboutSection
  extends SectionBase<"about"> {
  variant?: AboutLayoutVariant;
  content: {
    eyebrow?: string;
    heading: string;
    body: string[];
    highlights?: Array<{
      label: string;
      value: string;
    }>;
  };
}

export interface GalleryItem {
  id: string;
  title: string;
  category?: string;
  media: WebsiteMedia;
}

export interface GallerySection
  extends SectionBase<"gallery"> {
  variant?: GalleryLayoutVariant;
  content: {
    eyebrow?: string;
    heading: string;
    items: GalleryItem[];
  };
}

export interface TestimonialItem {
  id: string;
  quote: string;
  name: string;
  context?: string;
}

export interface TestimonialsSection
  extends SectionBase<"testimonials"> {
  variant?: TestimonialsLayoutVariant;
  content: {
    eyebrow?: string;
    heading: string;
    testimonials: TestimonialItem[];
  };
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface FaqSection
  extends SectionBase<"faq"> {
  content: {
    eyebrow?: string;
    heading: string;
    items: FaqItem[];
  };
}

export interface CtaSection
  extends SectionBase<"cta"> {
  variant?: CtaLayoutVariant;
  content: {
    eyebrow?: string;
    heading: string;
    description?: string;
    primaryAction: WebsiteAction;
    secondaryAction?: WebsiteAction;
  };
}

export interface ContactSection
  extends SectionBase<"contact"> {
  variant?: ContactLayoutVariant;
  content: {
    eyebrow?: string;
    heading: string;
    description?: string;
    phoneLabel?: string;
    emailLabel?: string;
    addressLabel?: string;
    hours?: Array<{
      days: string;
      times: string;
    }>;
  };
}

export interface FooterLink {
  label: string;
  href: WebsiteHref;
}

export interface FooterSection
  extends SectionBase<"footer"> {
  variant?: FooterLayoutVariant;
  content: {
    statement?: string;
    copyright: string;
    links?: FooterLink[];
  };
}

export type WebsiteSection =
  | HeroSection
  | ServicesSection
  | AboutSection
  | GallerySection
  | TestimonialsSection
  | FaqSection
  | CtaSection
  | ContactSection
  | FooterSection;

export type WebsiteSectionType =
  | "hero"
  | "services"
  | "about"
  | "gallery"
  | "testimonials"
  | "faq"
  | "cta"
  | "contact"
  | "footer";

export type WebsiteSlug = "/" | `/${string}`;

export interface WebsitePage {
  id: string;
  slug: WebsiteSlug;
  title: string;
  navLabel: string;
  enabled: boolean;
  sections: Exclude<WebsiteSection, FooterSection>[];
}

export interface WebsiteConfig {
  version: 2;
  business: BusinessDetails;
  theme: WebsiteTheme;
  navigation: NavigationItem[];
  pages: WebsitePage[];
  footer: FooterSection;
}

export interface LegacyWebsiteConfig {
  version: 1;
  business: BusinessDetails;
  theme: WebsiteTheme;
  navigation: NavigationItem[];
  sections: WebsiteSection[];
}

export type WebsiteConfigInput = WebsiteConfig | LegacyWebsiteConfig;
