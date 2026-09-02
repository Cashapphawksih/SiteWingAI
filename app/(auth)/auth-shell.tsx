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
    <main className="grid min-h-screen bg-background text-foreground lg:grid-cols-[minmax(320px,0.8fr)_minmax(480px,1.2fr)]">
      <section className="flex min-h-64 flex-col justify-between border-b border-line bg-surface p-6 sm:p-10 lg:min-h-screen lg:border-r lg:border-b-0 lg:p-14">
        <BrandMark />
        <div className="mt-20 max-w-lg lg:mt-0">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">{eyebrow}</p>
          <h1 className="mt-5 text-balance text-4xl font-medium leading-[1.02] tracking-[-0.045em] sm:text-5xl">{title}</h1>
          <p className="mt-6 max-w-md text-sm leading-7 text-muted">{description}</p>
        </div>
        <p className="mt-14 text-xs text-muted">SiteWing AI · Website creation, with intention.</p>
      </section>
      <section className="flex items-center justify-center px-5 py-14 sm:px-10">
        <div className="w-full max-w-md">
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
