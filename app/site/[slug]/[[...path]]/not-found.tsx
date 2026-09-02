import Link from "next/link";

export default function PublicSiteNotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-background px-5 text-foreground">
      <section className="max-w-lg border border-line bg-surface p-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Site unavailable</p>
        <h1 className="mt-4 text-3xl font-medium tracking-[-0.04em]">This page is not published.</h1>
        <p className="mt-4 text-sm leading-7 text-muted">The address may be incorrect, or the site owner may have unpublished it.</p>
        <Link className="mt-7 inline-flex min-h-11 items-center border border-foreground px-5 text-sm font-semibold" href="/">Visit SiteWing</Link>
      </section>
    </main>
  );
}
