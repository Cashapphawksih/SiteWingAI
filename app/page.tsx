import Link from "next/link";

import { SiteHeader } from "@/components/site-header";

const principles = [
  {
    number: "01",
    title: "Start with intent",
    description:
      "Begin with the audience, the offer, and the outcome. Every page should have a reason to exist.",
  },
  {
    number: "02",
    title: "Shape a clear system",
    description:
      "Turn the brief into a considered structure, consistent visual language, and purposeful content.",
  },
  {
    number: "03",
    title: "Keep creative control",
    description:
      "Refine the details and make deliberate choices before anything is ready to publish.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <main>
        <section className="mx-auto grid w-full max-w-7xl gap-14 px-5 pb-20 pt-16 sm:px-8 sm:pb-28 sm:pt-24 lg:grid-cols-[minmax(0,1.3fr)_minmax(300px,0.7fr)] lg:gap-20 lg:px-12 lg:pb-36 lg:pt-32">
          <div className="max-w-4xl">
            <p className="mb-7 text-xs font-semibold uppercase tracking-[0.22em] text-accent sm:mb-9">
              A more thoughtful way to build for the web
            </p>
            <h1 className="text-balance text-5xl font-medium leading-[0.96] tracking-[-0.055em] sm:text-7xl lg:text-[6.25rem]">
              Turn a clear idea into a website worth publishing.
            </h1>
            <p className="mt-8 max-w-2xl text-pretty text-lg leading-8 text-muted sm:mt-10 sm:text-xl sm:leading-9">
              SiteWing AI is being built for founders and teams who want a
              faster path from first brief to a polished, intentional web
              presence.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/build"
                className="inline-flex min-h-12 items-center justify-center bg-foreground px-6 text-sm font-semibold text-background transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground"
              >
                Open the builder
                <span aria-hidden="true" className="ml-3">
                  ↗
                </span>
              </Link>
              <Link
                href="#approach"
                className="inline-flex min-h-12 items-center justify-center border border-line px-6 text-sm font-semibold transition-colors hover:border-foreground hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground"
              >
                See the approach
              </Link>
            </div>
          </div>

          <aside className="flex min-h-80 flex-col justify-between border-l border-line pl-6 sm:pl-8 lg:min-h-full lg:pl-10">
            <p className="max-w-xs text-sm leading-6 text-muted">
              The best website tools should create momentum without removing
              judgment from the process.
            </p>
            <div className="mt-16 space-y-5">
              {["Brief", "Structure", "Refine", "Publish"].map(
                (stage, index) => (
                  <div
                    key={stage}
                    className="flex items-baseline justify-between border-b border-line pb-3"
                  >
                    <span className="text-xl font-medium tracking-tight">
                      {stage}
                    </span>
                    <span className="font-mono text-xs text-muted">
                      0{index + 1}
                    </span>
                  </div>
                ),
              )}
            </div>
          </aside>
        </section>

        <section
          id="approach"
          className="scroll-mt-20 border-y border-line bg-surface"
        >
          <div className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-8 sm:py-24 lg:px-12 lg:py-28">
            <div className="mb-14 max-w-2xl sm:mb-20">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
                The SiteWing approach
              </p>
              <h2 className="mt-5 text-balance text-3xl font-medium tracking-[-0.035em] sm:text-5xl">
                Speed should sharpen the work, not flatten it.
              </h2>
            </div>

            <div className="grid border-t border-line md:grid-cols-3">
              {principles.map((principle) => (
                <article
                  key={principle.number}
                  className="border-b border-line py-8 md:border-r md:border-b-0 md:px-8 md:py-10 md:first:pl-0 md:last:border-r-0 md:last:pr-0"
                >
                  <p className="font-mono text-xs text-muted">
                    {principle.number}
                  </p>
                  <h3 className="mt-10 text-xl font-medium tracking-tight">
                    {principle.title}
                  </h3>
                  <p className="mt-4 max-w-sm text-sm leading-7 text-muted">
                    {principle.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-20 sm:px-8 sm:py-24 lg:flex-row lg:items-end lg:justify-between lg:px-12 lg:py-28">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
              Built with restraint
            </p>
            <h2 className="mt-5 text-balance text-3xl font-medium tracking-[-0.035em] sm:text-5xl">
              A focused foundation for what comes next.
            </h2>
          </div>
          <p className="max-w-md text-sm leading-7 text-muted lg:text-right">
            SiteWing is at the beginning. The product experience will grow from
            this foundation one deliberate milestone at a time.
          </p>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-5 py-7 text-xs text-muted sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12">
          <p>SiteWing AI</p>
          <p>Website creation, with intention.</p>
        </div>
      </footer>
    </div>
  );
}
