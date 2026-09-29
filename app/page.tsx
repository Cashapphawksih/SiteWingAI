import Link from "next/link";

import { ProductPreview } from "@/components/marketing/product-preview";
import { SiteHeader } from "@/components/site-header";

const workflow = [
  ["01", "Describe", "Start with the business, audience, offer, and the standard the work needs to meet."],
  ["02", "Shape", "SiteWing turns the brief into a complete, typed site with real pages and responsive sections."],
  ["03", "Direct", "Refine through conversation or select the exact text, section, and image you want to change."],
  ["04", "Publish", "Review desktop and mobile, then publish a durable snapshot when the work is ready."],
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main>
        <section className="border-b border-line">
          <div className="mx-auto grid w-full max-w-[1480px] gap-12 px-5 pb-16 pt-16 sm:px-8 sm:pb-24 sm:pt-24 lg:grid-cols-[minmax(0,0.78fr)_minmax(560px,1.22fr)] lg:items-end lg:gap-14 lg:px-10 lg:pb-28 lg:pt-32">
            <div className="max-w-3xl lg:pb-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent">AI website creation, under your direction</p>
              <h1 className="mt-6 text-balance text-5xl font-semibold leading-[0.91] tracking-[-0.065em] sm:text-7xl lg:text-[5.7rem]">Build client-ready websites without surrendering the details.</h1>
              <p className="mt-8 max-w-2xl text-pretty text-lg leading-8 text-muted">SiteWing combines an AI web designer with a precise visual editor, so a clear brief becomes a polished multi-page website you can keep shaping.</p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link href="/signup" className="inline-flex min-h-12 items-center justify-center bg-foreground px-6 text-sm font-bold text-background transition-colors hover:bg-accent">Start a website <span className="ml-3" aria-hidden="true">↗</span></Link>
                <Link href="/login" className="inline-flex min-h-12 items-center justify-center border border-line px-6 text-sm font-bold transition-colors hover:border-foreground hover:bg-white">Open your workspace</Link>
              </div>
            </div>
            <div className="lg:translate-y-10"><ProductPreview /></div>
          </div>
        </section>

        <section id="approach" className="scroll-mt-20 border-b border-line bg-dark text-white">
          <div className="mx-auto w-full max-w-[1480px] px-5 py-20 sm:px-8 sm:py-28 lg:px-10">
            <div className="grid gap-10 border-b border-white/15 pb-14 lg:grid-cols-[0.7fr_1.3fr] lg:items-end">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-signal">One continuous workspace</p>
              <h2 className="max-w-4xl text-balance text-4xl font-semibold leading-[0.98] tracking-[-0.055em] sm:text-6xl">From first sentence to the version you are ready to put your name on.</h2>
            </div>
            <div className="grid md:grid-cols-2 xl:grid-cols-4">
              {workflow.map(([number, title, description]) => (
                <article key={number} className="border-b border-white/15 py-9 md:px-7 md:odd:border-r xl:border-r xl:border-b-0 xl:first:pl-0 xl:last:border-r-0 xl:last:pr-0">
                  <p className="font-mono text-[10px] text-white/40">{number}</p>
                  <h3 className="mt-12 text-2xl font-semibold tracking-[-0.035em]">{title}</h3>
                  <p className="mt-4 max-w-xs text-sm leading-7 text-white/55">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-line">
          <div className="mx-auto grid w-full max-w-[1480px] gap-12 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-2 lg:gap-24 lg:px-10">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent">Built for judgment, not autopilot</p>
              <h2 className="mt-5 max-w-2xl text-balance text-4xl font-semibold leading-[1] tracking-[-0.055em] sm:text-6xl">AI gets the work moving. You decide when it is good.</h2>
            </div>
            <div className="grid content-start gap-0 border-t border-line">
              {["Real multi-page site structure", "Direct text, media, and section editing", "Desktop and mobile review", "Private drafts and explicit publishing"].map((item, index) => (
                <div key={item} className="flex items-center justify-between border-b border-line py-5 text-sm font-semibold"><span>{item}</span><span className="font-mono text-[10px] text-muted">0{index + 1}</span></div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto flex w-full max-w-[1480px] flex-col gap-8 px-5 py-20 sm:px-8 sm:py-24 lg:flex-row lg:items-end lg:justify-between lg:px-10">
          <h2 className="max-w-4xl text-balance text-4xl font-semibold leading-[0.98] tracking-[-0.055em] sm:text-6xl">Bring the brief.<br />Leave with the website.</h2>
          <Link href="/signup" className="inline-flex min-h-12 shrink-0 items-center justify-center bg-foreground px-7 text-sm font-bold text-background hover:bg-accent">Create your first site</Link>
        </section>
      </main>
      <footer className="border-t border-line"><div className="mx-auto flex w-full max-w-[1480px] flex-col gap-3 px-5 py-7 text-xs text-muted sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10"><p>SiteWing AI</p><p>Websites shaped with intent.</p></div></footer>
    </div>
  );
}
