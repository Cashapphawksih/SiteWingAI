import Link from "next/link";

import { BrandMark } from "@/components/brand-mark";

interface AuthShellProps {
  alternateHref: string;
  alternateLabel: string;
  children: React.ReactNode;
  description: string;
  eyebrow: string;
  title: string;
}

export function AuthShell({ alternateHref, alternateLabel, children, description, eyebrow, title }: AuthShellProps) {
  return (
    <main className="grid min-h-screen bg-background text-foreground lg:grid-cols-[minmax(360px,.86fr)_minmax(0,1.14fr)]">
      <section className="relative flex min-h-80 flex-col justify-between overflow-hidden border-b border-white/10 bg-dark p-6 text-white sm:p-10 lg:min-h-screen lg:border-r lg:border-b-0 lg:p-14 xl:p-16">
        <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-signal/40 to-transparent" aria-hidden="true" />
        <BrandMark tone="inverse" />
        <div className="relative mt-20 max-w-xl lg:mt-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-signal">{eyebrow}</p>
          <h1 className="mt-6 text-balance text-4xl font-semibold leading-[0.92] tracking-[-0.065em] sm:text-6xl">{title}</h1>
          <p className="mt-7 max-w-md text-sm leading-7 text-white/55">{description}</p>
          <div className="mt-12 hidden max-w-md border-t border-white/15 lg:block">
            {["Generate complete sites", "Refine by conversation", "Edit the details directly"].map((item, index) => <div key={item} className="flex items-center justify-between border-b border-white/15 py-4 text-xs text-white/70"><span>{item}</span><span className="font-mono text-[9px] text-white/30">0{index + 1}</span></div>)}
          </div>
        </div>
        <p className="relative mt-14 text-[10px] uppercase tracking-[0.15em] text-white/35">Private workspace · Explicit publishing</p>
      </section>
      <section className="relative flex items-center justify-center px-5 py-14 sm:px-10 lg:px-16">
        <div className="absolute right-7 top-7 hidden text-[9px] font-bold uppercase tracking-[.16em] text-muted sm:block">Secure workspace</div>
        <div className="w-full max-w-[430px]">
          {children}
          <p className="mt-8 text-center text-sm text-muted">
            {alternateLabel.split("?")[0]}?{" "}
            <Link className="font-semibold text-foreground underline decoration-line underline-offset-4 hover:decoration-foreground" href={alternateHref}>
              {alternateLabel.split("?")[1] ?? alternateLabel}
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
