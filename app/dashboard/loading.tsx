export default function DashboardLoading() {
  return (
    <main className="min-h-screen bg-background px-5 py-10 text-foreground sm:px-8 lg:px-12" aria-live="polite">
      <div className="mx-auto w-full max-w-[1520px] animate-pulse">
        <div className="flex items-center justify-between border-b border-line pb-10"><div><div className="h-2 w-28 rounded-[2px] bg-surface-strong" /><div className="mt-6 h-13 w-72 max-w-full rounded-[3px] bg-surface-strong sm:w-[520px]" /></div><div className="hidden h-12 w-44 rounded-[3px] bg-foreground/10 sm:block" /></div>
        <p className="sr-only">Opening your website workspace…</p>
        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">{[0, 1, 2].map((item) => <div key={item} className="overflow-hidden rounded-[5px] border border-line bg-white"><div className="h-64 bg-surface-strong" /><div className="space-y-4 p-6"><div className="h-2 w-20 bg-surface-strong" /><div className="h-6 w-44 bg-surface-strong" /><div className="h-10 border-t border-line" /></div></div>)}</div>
      </div>
    </main>
  );
}
