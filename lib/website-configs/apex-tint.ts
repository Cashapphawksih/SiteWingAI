import { assertValidWebsiteConfig, normalizeWebsiteConfig } from "@/lib/website-config";
import type { LegacyWebsiteConfig, WebsiteConfig } from "@/types/website";

const apexTintConfigValue = {
  version: 1,
  business: {
    name: "Apex Tint",
    tagline: "Precision ceramic tint for the Las Vegas road.",
    phone: "(702) 555-0148",
    email: "appointments@apextint.example",
    location: "Las Vegas, Nevada",
  },
  theme: {
    style: "automotive",
    primaryColor: "#c7ff45",
    backgroundColor: "#0b0d0f",
    textColor: "#f4f5f0",
    fontStyle: "condensed",
    borderRadius: "2px",
  },
  navigation: [
    { id: "nav-services", label: "Services", href: "#services" },
    { id: "nav-work", label: "Work", href: "#gallery" },
    { id: "nav-about", label: "Why Apex", href: "#about" },
    { id: "nav-faq", label: "FAQ", href: "#faq" },
    { id: "nav-contact", label: "Contact", href: "#contact" },
  ],
  sections: [
    {
      id: "hero",
      type: "hero",
      enabled: true,
      content: {
        eyebrow: "Las Vegas ceramic window tint",
        heading: "Heat stays out. The drive stays yours.",
        description:
          "Precision-installed ceramic film engineered for serious heat rejection, lasting clarity, and a finish that belongs on the car.",
        primaryAction: {
          label: "Request an appointment",
          href: "#contact",
        },
        secondaryAction: {
          label: "Explore services",
          href: "#services",
        },
        proofPoints: [
          "Ceramic film options",
          "Lifetime workmanship warranty",
          "Appointment-only installation",
        ],
        media: {
          kind: "placeholder",
          label: "Precision. Protection. Presence.",
        },
      },
    },
    {
      id: "services",
      type: "services",
      enabled: true,
      content: {
        eyebrow: "Services",
        heading: "Built around the way you drive.",
        introduction:
          "Every installation starts with the vehicle, the glass, and the result you want—not a one-size-fits-all package.",
        services: [
          {
            id: "service-ceramic",
            number: "01",
            name: "Ceramic window tint",
            description:
              "High-performance film that cuts infrared heat while maintaining crisp visibility and signal clarity.",
            detail: "Heat rejection · UV protection · Optical clarity",
          },
          {
            id: "service-windshield",
            number: "02",
            name: "Windshield protection",
            description:
              "Clear ceramic coverage designed to reduce radiant heat across the largest piece of glass in your vehicle.",
            detail: "Near-clear options · Reduced cabin heat",
          },
          {
            id: "service-removal",
            number: "03",
            name: "Film removal & replacement",
            description:
              "Careful removal of aged, bubbled, or discolored tint followed by a clean professional installation.",
            detail: "Residue removal · Glass-safe process",
          },
        ],
      },
    },
    {
      id: "about",
      type: "about",
      enabled: true,
      content: {
        eyebrow: "Why Apex",
        heading: "Details decide the difference.",
        body: [
          "Apex Tint is an appointment-focused Las Vegas studio built around disciplined preparation and exact installation. We work deliberately, keep the environment controlled, and treat every edge as part of the finished result.",
          "Our recommendations are based on how you use the vehicle—from daily desert commutes to protecting a weekend car—not on pushing the darkest or most expensive option.",
        ],
        highlights: [
          { value: "99%", label: "UV rejection available" },
          { value: "1:1", label: "Vehicle attention" },
          { value: "LV", label: "Desert-driven expertise" },
        ],
      },
    },
    {
      id: "gallery",
      type: "gallery",
      enabled: true,
      content: {
        eyebrow: "Selected work",
        heading: "Clean installs. Quiet confidence.",
        items: [
          {
            id: "gallery-performance",
            title: "Performance sedan",
            category: "Ceramic tint",
            media: { kind: "placeholder", label: "Performance sedan" },
          },
          {
            id: "gallery-luxury",
            title: "Luxury coupe",
            category: "Full vehicle",
            media: { kind: "placeholder", label: "Luxury coupe" },
          },
          {
            id: "gallery-suv",
            title: "Daily SUV",
            category: "Heat control package",
            media: { kind: "placeholder", label: "Daily SUV" },
          },
          {
            id: "gallery-electric",
            title: "Electric crossover",
            category: "Glass roof protection",
            media: { kind: "placeholder", label: "Electric crossover" },
          },
        ],
      },
    },
    {
      id: "testimonials",
      type: "testimonials",
      enabled: true,
      content: {
        eyebrow: "Client notes",
        heading: "The result speaks softly.",
        testimonials: [
          {
            id: "testimonial-one",
            quote:
              "The cabin difference was immediate, but the finish is what impressed me. Every edge looks factory-clean.",
            name: "Marcus R.",
            context: "Ceramic tint · Performance sedan",
          },
          {
            id: "testimonial-two",
            quote:
              "They explained the options clearly and recommended a shade that actually works for my commute. No pressure, excellent work.",
            name: "Danielle K.",
            context: "Full vehicle · Daily driver",
          },
          {
            id: "testimonial-three",
            quote:
              "The appointment was organized, the timing was accurate, and the car came back exactly how I wanted it.",
            name: "Anthony L.",
            context: "Ceramic tint · Luxury coupe",
          },
        ],
      },
    },
    {
      id: "faq",
      type: "faq",
      enabled: true,
      content: {
        eyebrow: "Questions, answered",
        heading: "Before your appointment.",
        items: [
          {
            id: "faq-time",
            question: "How long does an installation take?",
            answer:
              "Most full-vehicle appointments take two to four hours. Timing varies by vehicle, existing film, and the coverage selected.",
          },
          {
            id: "faq-ceramic",
            question: "What makes ceramic film different?",
            answer:
              "Ceramic film is designed to reject infrared heat without relying on metallic layers. That means strong performance, clear visibility, and no interference with connected devices.",
          },
          {
            id: "faq-care",
            question: "When can I roll the windows down?",
            answer:
              "Plan to keep your windows up for the curing period discussed at pickup, typically several days depending on weather and film conditions.",
          },
          {
            id: "faq-law",
            question: "Can you help me choose a legal shade?",
            answer:
              "Yes. We can explain available options and current Nevada requirements so you can make an informed decision for your vehicle.",
          },
        ],
      },
    },
    {
      id: "cta",
      type: "cta",
      enabled: true,
      content: {
        eyebrow: "Ready when you are",
        heading: "Make the Las Vegas heat feel optional.",
        description:
          "Tell us about your vehicle and the result you want. We’ll help you choose the right film and coverage.",
        primaryAction: {
          label: "Call Apex Tint",
          href: "tel:+17025550148",
          accessibleLabel: "Call Apex Tint at 702-555-0148",
        },
        secondaryAction: {
          label: "View contact details",
          href: "#contact",
        },
      },
    },
    {
      id: "contact",
      type: "contact",
      enabled: true,
      content: {
        eyebrow: "Contact",
        heading: "Start with your vehicle.",
        description:
          "Share the year, make, model, and the coverage you are considering. Appointments are confirmed directly.",
        phoneLabel: "Call or text",
        emailLabel: "Email",
        addressLabel: "Service area",
        hours: [
          { days: "Monday–Friday", times: "8:00 AM–6:00 PM" },
          { days: "Saturday", times: "By appointment" },
          { days: "Sunday", times: "Closed" },
        ],
      },
    },
    {
      id: "footer",
      type: "footer",
      enabled: true,
      content: {
        statement: "Precision ceramic tint for the Las Vegas road.",
        copyright: "© 2026 Apex Tint. Sample website configuration.",
        links: [
          { label: "Services", href: "#services" },
          { label: "FAQ", href: "#faq" },
          { label: "Contact", href: "#contact" },
        ],
      },
    },
  ],
} satisfies LegacyWebsiteConfig;

export const apexTintLegacyConfig: LegacyWebsiteConfig = apexTintConfigValue;
export const apexTintConfig: WebsiteConfig = normalizeWebsiteConfig(apexTintLegacyConfig);

assertValidWebsiteConfig(apexTintConfig);
