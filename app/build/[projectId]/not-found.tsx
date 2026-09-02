import Link from "next/link";

export default function ProjectNotFound() {
  return <main className="grid min-h-screen place-items-center bg-background px-5"><section className="max-w-lg border border-line bg-surface p-8"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Project not found</p><h1 className="mt-4 text-3xl font-medium tracking-[-0.04em]">That project is not available.</h1><p className="mt-4 text-sm leading-7 text-muted">It may have been deleted, or it may belong to another account.</p><Link href="/dashboard" className="mt-7 inline-flex min-h-11 items-center bg-foreground px-5 text-sm font-semibold text-background">Return to dashboard</Link></section></main>;
}
