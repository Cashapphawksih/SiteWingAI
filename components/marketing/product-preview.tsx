export function ProductPreview() {
  return (
    <div className="motion-rise-delayed overflow-hidden rounded-[6px] border border-[#353730] bg-[#171815] shadow-[0_32px_90px_rgba(18,19,16,0.22)]" aria-label="SiteWing builder product preview">
      <div className="grid h-12 grid-cols-[1fr_auto_1fr] items-center border-b border-white/10 px-4 text-white">
        <div className="flex items-center gap-3 text-[10px] font-semibold"><span className="size-2 rounded-[1px] bg-signal shadow-[0_0_0_4px_rgba(218,254,104,.08)]" />Apex Tint <span className="text-white/35">Saved</span></div>
        <div className="hidden items-center gap-1 rounded-[3px] border border-white/10 bg-black/15 p-0.5 text-[9px] sm:flex"><span className="rounded-[2px] bg-white px-3 py-1.5 text-dark">Preview</span><span className="px-3 py-1.5 text-white/55">Edit</span><span className="px-3 py-1.5 text-white/55">Code</span></div>
        <span className="justify-self-end rounded-[2px] bg-signal px-3 py-1.5 text-[9px] font-bold text-dark">Publish</span>
      </div>
      <div className="grid min-h-[430px] grid-cols-[132px_minmax(0,1fr)] sm:min-h-[540px] sm:grid-cols-[205px_minmax(0,1fr)]">
        <div className="flex flex-col border-r border-white/10 bg-[#1d1e1b] p-4 text-white sm:p-5">
          <div className="flex items-center gap-2"><span className="grid size-5 place-items-center rounded-[2px] bg-signal text-[8px] font-black text-dark">S</span><p className="text-[8px] font-bold uppercase tracking-[0.14em] text-white/45">SiteWing</p></div>
          <div className="mt-7 space-y-5 text-[10px] leading-5">
            <p className="text-white/48">Make the hero feel more premium and lead with ceramic tint.</p>
            <div className="rounded-r-[3px] border-l-2 border-signal bg-white/[.025] py-2 pl-3 text-white/75">The hero now leads with ceramic tint and uses a sharper editorial layout.</div>
          </div>
          <div className="mt-auto rounded-[4px] border border-white/12 bg-black/20 p-3 text-[9px] leading-4 text-white/40"><span>Ask SiteWing to change anything…</span><div className="mt-4 flex items-center justify-between text-[7px] uppercase tracking-wider text-white/25"><span>⌘ Enter</span><span className="grid size-6 place-items-center rounded-[2px] bg-signal text-xs text-dark">↑</span></div></div>
        </div>
        <div className="relative bg-[#292a26] p-2 sm:p-6">
          <div className="mx-auto min-h-full max-w-[760px] overflow-hidden rounded-[2px] bg-[#111] text-white shadow-[0_18px_50px_rgba(0,0,0,0.35)]">
            <div className="flex items-center justify-between border-b border-white/15 px-4 py-4 sm:px-7"><span className="text-[11px] font-bold tracking-[0.12em]">APEX TINT</span><span className="text-[8px] uppercase tracking-[0.15em] text-white/55">Services&nbsp;&nbsp; About&nbsp;&nbsp; Contact</span></div>
            <div className="grid min-h-[342px] content-end bg-[linear-gradient(120deg,#111_0%,#1c1d1b_62%,#33352f_100%)] px-5 py-9 sm:min-h-[442px] sm:px-10 sm:py-12">
              <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-[#dfff67]">Las Vegas · Ceramic window tint</p>
              <h2 className="mt-4 max-w-xl text-3xl font-semibold leading-[0.92] tracking-[-0.06em] sm:text-6xl">Heat out.<br />Style intact.</h2>
              <p className="mt-5 max-w-md text-[10px] leading-5 text-white/58 sm:text-xs">Premium ceramic film installed with exacting standards for a cooler, cleaner drive.</p>
              <div className="mt-7 flex gap-3"><span className="bg-[#dfff67] px-4 py-2 text-[8px] font-bold text-black">Get a quote</span><span className="border border-white/25 px-4 py-2 text-[8px]">Explore services</span></div>
            </div>
          </div>
          <div className="absolute right-4 top-20 hidden w-36 rounded-[4px] border border-white/15 bg-[#20211e]/95 p-3 text-white shadow-2xl backdrop-blur sm:block">
            <div className="flex items-center justify-between"><span className="text-[7px] font-bold uppercase tracking-widest text-signal">Selected</span><span className="text-xs text-white/40">×</span></div>
            <p className="mt-2 text-[10px] font-semibold">Hero section</p>
            <div className="mt-3 h-6 rounded-[2px] border border-white/10 bg-black/20" />
            <div className="mt-2 h-6 rounded-[2px] bg-signal" />
          </div>
        </div>
      </div>
    </div>
  );
}
