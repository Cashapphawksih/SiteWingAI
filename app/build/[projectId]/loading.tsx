export default function ProjectLoading() {
  return (
    <main className="grid min-h-screen place-items-center bg-dark px-5 text-white" aria-live="polite">
      <div className="text-center">
        <span className="mx-auto block size-2 bg-signal" aria-hidden="true" />
        <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.18em] text-dark-muted">Opening workspace</p>
        <p className="mt-2 text-sm text-white/70">Loading project…</p>
      </div>
    </main>
  );
}
