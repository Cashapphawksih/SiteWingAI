import Link from "next/link";

import { ProductPreview } from "@/components/marketing/product-preview";
import { SiteHeader } from "@/components/site-header";

const workflow = [
  ["01", "Brief the direction", "Give SiteWing the business, the audience, and what the finished site needs to feel like."],
  ["02", "Review a real site", "Get responsive pages with typed sections—not a screenshot, loose markup, or a disposable mockup."],
  ["03", "Direct every detail", "Refine through conversation, then select the exact copy, image, section, or page you want to shape."],
  ["04", "Publish deliberately", "Keep drafts private until the version is ready, then publish a durable customer-facing snapshot."],
];

const capabilities = [
  ["Direct editing", "Select real elements in the canvas and make precise changes without leaving the website."],
  ["Multi-page structure", "Create, rename, reorder, and move between pages in one continuous workspace."],
  ["Safe publishing", "Separate private drafts from the public version, with explicit republishing when changes are ready."],
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main>
        <section className="relative overflow-hidden border-b border-line">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-foreground/10" />
          <div className="mx-auto w-full max-w-[1520px] px-5 pb-16 pt-14 sm:px-8 sm:pb-24 sm:pt-20 lg:px-12 lg:pb-32 lg:pt-24">
            <div className="motion-rise grid gap-8 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)] xl:items-end">
              <div className="min-w-0">
                <p className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.22em] text-accent"><span className="size-1.5 bg-accent" /> AI website creation, under your direction</p>
                <h1 className="mt-7 max-w-6xl text-balance text-[clamp(3.4rem,7vw,7.2rem)] font-semibold leading-[0.84] tracking-[-0.075em]">From a clear brief<br /><span className="text-muted">to a serious website.</span></h1>
              </div>
              <div className="border-l border-line pl-6 lg:mb-2 lg:pl-8">
                <p className="max-w-sm text-pretty text-base leading-7 text-muted">SiteWing combines an AI web designer with a precise visual editor, so the first version arrives fast and the final version still feels considered.</p>
                <div className="mt-7 flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
                  <Link href="/signup" className="inline-flex min-h-12 items-center justify-center rounded-[3px] bg-foreground px-6 text-sm font-bold text-background shadow-[0_10px_30px_rgba(16,17,15,.14)] hover:-translate-y-0.5 hover:bg-accent">Build your website <span className="ml-3" aria-hidden="true">↗</span></Link>
                  <Link href="#product" className="inline-flex min-h-12 items-center justify-center rounded-[3px] border border-line bg-white/40 px-6 text-sm font-bold hover:border-foreground hover:bg-white">See how it works</Link>
                </div>
              </div>
            </div>
            <div id="product" className="scroll-mt-24 mt-14 sm:mt-20 lg:mt-24"><ProductPreview /></div>
            <div className="mt-6 flex flex-col gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted sm:flex-row sm:items-center sm:justify-between"><span>One workspace · conversation + direct editing</span><span>Desktop · tablet · mobile</span></div>
          </div>
        </section>

        <section id="approach" className="scroll-mt-20 bg-dark text-white">
          <div className="mx-auto w-full max-w-[1520px] px-5 py-20 sm:px-8 sm:py-28 lg:px-12 lg:py-36">
            <div className="grid gap-10 lg:grid-cols-[.62fr_1.38fr] lg:items-end">
              <div><p className="text-[10px] font-bold uppercase tracking-[0.22em] text-signal">The working method</p><p className="mt-5 max-w-sm text-sm leading-7 text-white/50">AI does the heavy lifting. The interface keeps authorship, structure, and publishing decisions in your hands.</p></div>
              <h2 className="max-w-5xl text-balance text-4xl font-semibold leading-[.94] tracking-[-0.06em] sm:text-7xl">A fast first draft is only the beginning.</h2>
            </div>
            <div className="mt-16 grid border-t border-white/15 md:grid-cols-2 xl:grid-cols-4">
              {workflow.map(([number, title, description]) => <article key={number} className="group border-b border-white/15 py-8 md:px-7 md:odd:border-r xl:border-r xl:border-b-0 xl:first:pl-0 xl:last:border-r-0 xl:last:pr-0"><div className="flex items-center justify-between"><p className="font-mono text-[9px] text-white/35">{number}</p><span className="size-1.5 bg-white/15 transition-colors group-hover:bg-signal" /></div><h3 className="mt-16 text-xl font-semibold tracking-[-0.035em]">{title}</h3><p className="mt-4 max-w-xs text-sm leading-7 text-white/50">{description}</p></article>)}
            </div>
          </div>
        </section>

        <section className="border-b border-line">
          <div className="mx-auto grid w-full max-w-[1520px] gap-12 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-[.85fr_1.15fr] lg:gap-24 lg:px-12 lg:py-36">
            <div className="lg:sticky lg:top-28 lg:self-start"><p className="text-[10px] font-bold uppercase tracking-[0.22em] text-accent">Precision after generation</p><h2 className="mt-6 max-w-xl text-balance text-4xl font-semibold leading-[.96] tracking-[-0.06em] sm:text-6xl">Talk to the whole site. Edit the exact detail.</h2><p className="mt-7 max-w-md text-sm leading-7 text-muted">Use natural language when the direction changes. Use the inspector when one headline, image, section, or page needs your attention.</p></div>
            <div className="overflow-hidden rounded-[6px] border border-line bg-dark p-3 shadow-[0_24px_70px_rgba(16,17,15,.13)] sm:p-6">
              <div className="grid min-h-[470px] rounded-[3px] bg-[#282925] p-3 sm:grid-cols-[1fr_210px] sm:p-5">
                <div className="grid content-end rounded-[2px] bg-[#f0eee7] p-7 text-dark sm:p-10"><span className="text-[9px] font-bold uppercase tracking-[.2em] text-accent">Independent hospitality</span><h3 className="mt-4 max-w-lg text-4xl font-semibold leading-[.9] tracking-[-.06em] sm:text-6xl">A quieter kind of stay.</h3><p className="mt-5 max-w-sm text-xs leading-6 text-muted">Thoughtful rooms, local rituals, and enough space to notice where you are.</p><span className="mt-8 w-fit rounded-[2px] bg-dark px-5 py-3 text-[10px] font-bold text-white">Explore rooms</span></div>
                <aside className="hidden border-l border-white/10 bg-[#1d1e1b] p-4 text-white sm:block"><p className="text-[8px] font-bold uppercase tracking-[.18em] text-signal">Hero selected</p><p className="mt-2 text-xs font-semibold">Content</p>{["Eyebrow", "Heading", "Description", "Button label"].map((label) => <div key={label} className="mt-4"><span className="text-[7px] uppercase tracking-wider text-white/35">{label}</span><div className="mt-1.5 h-8 rounded-[2px] border border-white/10 bg-black/20" /></div>)}<div className="mt-5 h-8 rounded-[2px] bg-signal" /></aside>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-line bg-[#e9e8e1]">
          <div className="mx-auto w-full max-w-[1520px] px-5 py-20 sm:px-8 sm:py-28 lg:px-12">
            <div className="grid gap-10 lg:grid-cols-2 lg:items-end"><div><p className="text-[10px] font-bold uppercase tracking-[.22em] text-accent">Built for real delivery</p><h2 className="mt-5 max-w-3xl text-4xl font-semibold leading-[.96] tracking-[-.06em] sm:text-6xl">One website system, from draft to live.</h2></div><p className="max-w-lg text-sm leading-7 text-muted lg:justify-self-end">For independent businesses, studios, and people building client work who need speed without giving up standards.</p></div>
            <div className="mt-14 grid gap-px overflow-hidden rounded-[5px] bg-line md:grid-cols-3">{capabilities.map(([title, description], index) => <article key={title} className="group min-h-64 bg-background p-7 sm:p-9"><div className="flex items-center justify-between"><span className="font-mono text-[9px] text-muted">0{index + 1}</span><span className="text-lg text-muted transition-transform group-hover:translate-x-1">↗</span></div><h3 className="mt-20 text-2xl font-semibold tracking-[-.04em]">{title}</h3><p className="mt-4 max-w-sm text-sm leading-7 text-muted">{description}</p></article>)}</div>
          </div>
        </section>

        <section className="mx-auto grid w-full max-w-[1520px] gap-10 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-[1fr_auto] lg:items-end lg:px-12 lg:py-32"><div><p className="text-[10px] font-bold uppercase tracking-[.22em] text-accent">Ready when the brief is</p><h2 className="mt-5 max-w-5xl text-balance text-5xl font-semibold leading-[.9] tracking-[-.07em] sm:text-7xl">Make the first version.<br /><span className="text-muted">Then make it yours.</span></h2></div><Link href="/signup" className="inline-flex min-h-13 shrink-0 items-center justify-center rounded-[3px] bg-foreground px-8 text-sm font-bold text-background shadow-[0_12px_30px_rgba(16,17,15,.14)] hover:-translate-y-0.5 hover:bg-accent">Create your first site</Link></section>
      </main>
      <footer className="border-t border-line bg-dark text-white"><div className="mx-auto flex w-full max-w-[1520px] flex-col gap-5 px-5 py-9 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12"><p className="font-semibold text-white">SiteWing AI</p><p>Websites shaped with intent.</p></div></footer>
    </div>
  );
}
