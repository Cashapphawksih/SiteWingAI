import Link from "next/link";
import type { ReactNode } from "react";

import { BrandMark } from "@/components/brand-mark";

export function AppHeader({ actions, backHref, label }: { actions?: ReactNode; backHref?: string; label?: string }) {
  return (
    <header className="border-b border-line bg-background/95">
      <div className="mx-auto flex min-h-17 w-full max-w-[1480px] items-center justify-between gap-5 px-5 sm:px-8 lg:px-10">
        <div className="flex min-w-0 items-center gap-5">
          <BrandMark href={backHref ?? "/"} />
          {label ? <><span className="hidden h-5 w-px bg-line sm:block" aria-hidden="true" /><span className="hidden truncate text-xs font-semibold text-muted sm:block">{label}</span></> : null}
        </div>
        {actions ? <div className="flex items-center gap-3">{actions}</div> : null}
      </div>
    </header>
  );
}

export function PageIntro({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return (
    <div className="grid gap-8 border-b border-line pb-9 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end sm:pb-11">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-accent">{eyebrow}</p>
        <h1 className="mt-4 max-w-4xl text-balance text-4xl font-semibold leading-[0.98] tracking-[-0.055em] sm:text-6xl">{title}</h1>
        <p className="mt-5 max-w-2xl text-pretty text-sm leading-7 text-muted sm:text-base">{description}</p>
      </div>
      {action}
    </div>
  );
}

export function AppNotice({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "success" | "error" }) {
  const toneClass = tone === "error" ? "border-danger text-[#71251f]" : tone === "success" ? "border-accent" : "border-line";
  return <div className={`border-l-2 bg-white px-4 py-3 text-sm leading-6 ${toneClass}`} role={tone === "error" ? "alert" : "status"}>{children}</div>;
}

export function StatusBadge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "live" | "pending" }) {
  const toneClass = tone === "live" ? "bg-accent text-white" : tone === "pending" ? "bg-[#f0dca5] text-[#5d4814]" : "bg-surface-strong text-foreground";
  return <span className={`inline-flex min-h-6 items-center px-2.5 text-[10px] font-bold uppercase tracking-[0.12em] ${toneClass}`}>{children}</span>;
}

export function TextLink({ children, href }: { children: ReactNode; href: string }) {
  return <Link href={href} className="text-sm font-semibold underline decoration-line underline-offset-4 transition-colors hover:decoration-foreground">{children}</Link>;
}
