import Link from "next/link";

import { BrandMark } from "@/components/brand-mark";
import { primaryNavigation } from "@/lib/site";

export function SiteHeader() {
  return (
    <header className="border-b border-line">
      <div className="mx-auto flex h-18 w-full max-w-7xl items-center justify-between px-5 sm:h-20 sm:px-8 lg:px-12">
        <BrandMark />
        <nav aria-label="Primary navigation" className="flex items-center gap-5 sm:gap-8">
          {primaryNavigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-muted transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
