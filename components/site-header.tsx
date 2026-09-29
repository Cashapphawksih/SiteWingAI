import Link from "next/link";

import { BrandMark } from "@/components/brand-mark";
import { primaryNavigation } from "@/lib/site";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-line/80 bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex h-18 w-full max-w-[1520px] items-center justify-between px-5 sm:px-8 lg:px-12">
        <BrandMark />
        <nav aria-label="Primary navigation" className="hidden items-center gap-8 md:flex">
          {primaryNavigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-xs font-semibold text-muted hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
          <Link href="/login" className="text-xs font-semibold text-muted hover:text-foreground">Log in</Link>
          <Link href="/signup" className="inline-flex min-h-10 items-center rounded-[3px] bg-foreground px-5 text-xs font-bold text-background shadow-[0_8px_24px_rgba(16,17,15,.12)] hover:-translate-y-0.5 hover:bg-accent">Start building <span className="ml-2" aria-hidden="true">↗</span></Link>
        </nav>
        <details className="group relative md:hidden">
          <summary className="flex min-h-10 cursor-pointer list-none items-center gap-2 rounded-[3px] border border-line bg-white px-3 text-xs font-bold [&::-webkit-details-marker]:hidden">Menu <span className="text-base font-normal group-open:rotate-45" aria-hidden="true">+</span></summary>
          <nav aria-label="Mobile navigation" className="absolute right-0 top-[calc(100%+10px)] grid w-56 rounded-[4px] border border-line bg-white p-2 shadow-[0_20px_60px_rgba(16,17,15,.16)]">
            {primaryNavigation.map((item) => <Link key={item.href} href={item.href} className="rounded-[2px] px-4 py-3 text-sm font-semibold hover:bg-surface">{item.label}</Link>)}
            <Link href="/login" className="rounded-[2px] px-4 py-3 text-sm font-semibold hover:bg-surface">Log in</Link>
            <Link href="/signup" className="mt-1 rounded-[2px] bg-foreground px-4 py-3 text-sm font-bold text-background">Start building</Link>
          </nav>
        </details>
      </div>
    </header>
  );
}
