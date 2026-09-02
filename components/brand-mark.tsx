import Link from "next/link";

type BrandMarkProps = {
  href?: string;
};

export function BrandMark({ href = "/" }: BrandMarkProps) {
  return (
    <Link
      href={href}
      aria-label="SiteWing AI home"
      className="group inline-flex items-center gap-3 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground"
    >
      <span
        aria-hidden="true"
        className="relative grid size-8 place-items-center border border-foreground transition-colors group-hover:bg-foreground"
      >
        <span className="h-px w-3 -rotate-45 bg-foreground transition-colors group-hover:bg-background" />
        <span className="absolute h-3 w-px rotate-45 bg-foreground transition-colors group-hover:bg-background" />
      </span>
      <span className="text-sm font-semibold tracking-[-0.02em]">
        SiteWing <span className="text-muted">AI</span>
      </span>
    </Link>
  );
}
