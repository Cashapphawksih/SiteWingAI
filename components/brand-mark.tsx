import Link from "next/link";

type BrandMarkProps = {
  href?: string;
  tone?: "default" | "inverse";
};

export function BrandMark({ href = "/", tone = "default" }: BrandMarkProps) {
  const inverse = tone === "inverse";
  return (
    <Link
      href={href}
      aria-label="SiteWing AI home"
      className={`group inline-flex items-center gap-3 focus-visible:outline-2 focus-visible:outline-offset-4 ${inverse ? "text-white focus-visible:outline-white" : "text-foreground focus-visible:outline-foreground"}`}
    >
      <span
        aria-hidden="true"
        className={`relative grid size-8 place-items-center border transition-colors ${inverse ? "border-white/55 group-hover:border-signal group-hover:bg-signal" : "border-foreground group-hover:bg-foreground"}`}
      >
        <span className={`h-px w-3 -rotate-45 transition-colors ${inverse ? "bg-white group-hover:bg-dark" : "bg-foreground group-hover:bg-background"}`} />
        <span className={`absolute h-3 w-px rotate-45 transition-colors ${inverse ? "bg-white group-hover:bg-dark" : "bg-foreground group-hover:bg-background"}`} />
      </span>
      <span className="text-sm font-semibold tracking-[-0.02em]">
        SiteWing <span className={inverse ? "text-white/55" : "text-muted"}>AI</span>
      </span>
    </Link>
  );
}
