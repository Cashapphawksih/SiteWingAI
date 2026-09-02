import type { NavigationItem, SiteConfig } from "@/types/site";

export const siteConfig: SiteConfig = {
  name: "SiteWing AI",
  description:
    "A thoughtful new way for founders and teams to create polished websites.",
};

export const primaryNavigation: NavigationItem[] = [
  { label: "Approach", href: "/#approach" },
  { label: "Builder", href: "/build" },
];
