import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { loginAction } from "@/app/(auth)/actions";
import { AuthShell } from "@/app/(auth)/auth-shell";
import { getAuthenticatedUser, safeReturnPath } from "@/lib/supabase/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Log in" };

const errorMessages: Record<string, string> = {
  configuration: "Supabase is not configured yet. Add the required environment variables to continue.",
  confirmation: "The confirmation link is invalid or has expired. Request a new signup email and try again.",
  credentials: "The email or password was not accepted.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  if (isSupabaseConfigured() && await getAuthenticatedUser()) redirect("/dashboard");
  const params = await searchParams;
  const errorKey = typeof params.error === "string" ? params.error : "";
  const nextPath = safeReturnPath(typeof params.next === "string" ? params.next : undefined);
  const message = params.message === "check-email" ? "Check your email to confirm your account, then log in." : null;

  return (
    <AuthShell alternateHref="/signup" alternateLabel="New to SiteWing?Create an account" description="Return to your saved websites and continue from the latest validated version." eyebrow="Welcome back" title="Continue building with clarity.">
      <div className="mb-8">
        <h2 className="text-2xl font-medium tracking-[-0.03em]">Log in</h2>
        <p className="mt-2 text-sm text-muted">Use the email and password associated with your account.</p>
      </div>
      {errorMessages[errorKey] ? <p className="mb-5 border-l-2 border-red-700 bg-red-50 px-4 py-3 text-sm text-red-900" role="alert">{errorMessages[errorKey]}</p> : null}
      {message ? <p className="mb-5 border-l-2 border-accent bg-surface px-4 py-3 text-sm" role="status">{message}</p> : null}
      <form action={loginAction} className="grid gap-5">
        <input type="hidden" name="next" value={nextPath} />
        <label className="grid gap-2 text-sm font-semibold">Email<input className="h-12 border border-line bg-white px-4 font-normal outline-none focus:border-foreground" type="email" name="email" autoComplete="email" required maxLength={254} /></label>
        <label className="grid gap-2 text-sm font-semibold">Password<input className="h-12 border border-line bg-white px-4 font-normal outline-none focus:border-foreground" type="password" name="password" autoComplete="current-password" required minLength={8} maxLength={72} /></label>
        <button className="mt-2 min-h-12 bg-foreground px-5 text-sm font-semibold text-background transition-colors hover:bg-accent disabled:opacity-50" type="submit" disabled={!isSupabaseConfigured()}>Log in</button>
      </form>
    </AuthShell>
  );
}
