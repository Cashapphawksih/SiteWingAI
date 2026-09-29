export function ProductPreview() {
  return (
    <div className="overflow-hidden border border-[#33352f] bg-[#171815] shadow-[0_28px_70px_rgba(18,19,16,0.18)]" aria-label="SiteWing builder product preview">
      <div className="flex h-11 items-center justify-between border-b border-white/10 px-4 text-white">
        <div className="flex items-center gap-3 text-[10px] font-semibold"><span className="size-2 bg-signal" />Apex Tint <span className="text-white/40">Saved</span></div>
        <div className="flex items-center gap-1 border border-white/10 bg-white/5 p-0.5 text-[9px]"><span className="bg-white px-3 py-1.5 text-dark">Preview</span><span className="px-3 py-1.5 text-white/55">Edit</span></div>
        <span className="bg-signal px-3 py-1.5 text-[9px] font-bold text-dark">Publish</span>
      </div>
      <div className="grid min-h-[420px] grid-cols-[150px_minmax(0,1fr)] sm:min-h-[520px] sm:grid-cols-[210px_minmax(0,1fr)]">
        <div className="flex flex-col border-r border-white/10 bg-[#1d1e1b] p-4 text-white sm:p-5">
          <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-white/40">SiteWing assistant</p>
          <div className="mt-6 space-y-4 text-[10px] leading-5">
            <p className="text-white/48">Make the hero feel more premium and lead with ceramic tint.</p>
            <div className="border-l border-signal pl-3 text-white/75">The hero now leads with ceramic tint and uses a sharper editorial layout.</div>
          </div>
          <div className="mt-auto border border-white/12 bg-black/15 p-3 text-[9px] leading-4 text-white/40">Ask SiteWing to change anything…</div>
        </div>
        <div className="bg-[#292a26] p-3 sm:p-6">
          <div className="mx-auto min-h-full max-w-[760px] bg-[#111] text-white shadow-[0_18px_50px_rgba(0,0,0,0.35)]">
            <div className="flex items-center justify-between border-b border-white/15 px-4 py-4 sm:px-7"><span className="text-[11px] font-bold tracking-[0.12em]">APEX TINT</span><span className="text-[8px] uppercase tracking-[0.15em] text-white/55">Services&nbsp;&nbsp; About&nbsp;&nbsp; Contact</span></div>
            <div className="grid min-h-[330px] content-end bg-[linear-gradient(120deg,#111_0%,#1c1d1b_62%,#33352f_100%)] px-5 py-9 sm:min-h-[430px] sm:px-10 sm:py-12">
              <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-[#dfff67]">Las Vegas · Ceramic window tint</p>
              <h2 className="mt-4 max-w-xl text-3xl font-semibold leading-[0.92] tracking-[-0.06em] sm:text-6xl">Heat out.<br />Style intact.</h2>
              <p className="mt-5 max-w-md text-[10px] leading-5 text-white/58 sm:text-xs">Premium ceramic film installed with exacting standards for a cooler, cleaner drive.</p>
              <div className="mt-7 flex gap-3"><span className="bg-[#dfff67] px-4 py-2 text-[8px] font-bold text-black">Get a quote</span><span className="border border-white/25 px-4 py-2 text-[8px]">Explore services</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
