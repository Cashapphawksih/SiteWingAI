import Link from "next/link";

import { BrandMark } from "@/components/brand-mark";
import { primaryNavigation } from "@/lib/site";

export function SiteHeader() {
  return (
    <header className="border-b border-line bg-background/95">
      <div className="mx-auto flex h-17 w-full max-w-[1480px] items-center justify-between px-5 sm:px-8 lg:px-10">
        <BrandMark />
        <nav aria-label="Primary navigation" className="flex items-center gap-4 sm:gap-7">
          {primaryNavigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="hidden text-sm font-semibold text-muted transition-colors hover:text-foreground sm:block"
            >
              {item.label}
            </Link>
          ))}
          <Link href="/login" className="text-sm font-semibold text-muted hover:text-foreground">Log in</Link>
          <Link href="/signup" className="inline-flex min-h-9 items-center bg-foreground px-4 text-xs font-bold text-background hover:bg-accent">Start building</Link>
        </nav>
      </div>
    </header>
  );
}
