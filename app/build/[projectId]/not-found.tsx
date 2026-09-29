import Link from "next/link";

export default function ProjectNotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-dark px-5 text-white">
      <section className="w-full max-w-lg border border-white/15 bg-[#1b1c19] p-8 sm:p-10">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-signal">Project not found</p>
        <h1 className="mt-5 text-4xl font-semibold leading-none tracking-[-0.05em]">That project is not available.</h1>
        <p className="mt-5 text-sm leading-7 text-dark-muted">It may have been deleted, or it may belong to another account.</p>
        <Link href="/dashboard" className="mt-8 inline-flex min-h-11 items-center bg-signal px-5 text-sm font-bold text-dark hover:bg-white">Return to dashboard</Link>
      </section>
    </main>
  );
}
