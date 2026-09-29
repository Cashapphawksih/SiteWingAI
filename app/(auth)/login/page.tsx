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
      <div className="mb-9 border-b border-line pb-7">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-accent">Your workspace</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-[-0.045em]">Log in</h2>
        <p className="mt-2 text-sm text-muted">Use the email and password associated with your account.</p>
      </div>
      {errorMessages[errorKey] ? <p className="mb-5 border-l-2 border-danger bg-white px-4 py-3 text-sm text-[#71251f]" role="alert">{errorMessages[errorKey]}</p> : null}
      {message ? <p className="mb-5 border-l-2 border-accent bg-white px-4 py-3 text-sm" role="status">{message}</p> : null}
      <form action={loginAction} className="grid gap-6">
        <input type="hidden" name="next" value={nextPath} />
        <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.12em]">Email<input className="h-14 rounded-[4px] border border-line bg-white px-4 text-sm font-normal normal-case tracking-normal shadow-[0_5px_20px_rgba(16,17,15,.035)] outline-none focus:border-accent focus:ring-3 focus:ring-accent/10" type="email" name="email" autoComplete="email" required maxLength={254} /></label>
        <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.12em]">Password<input className="h-14 rounded-[4px] border border-line bg-white px-4 text-sm font-normal normal-case tracking-normal shadow-[0_5px_20px_rgba(16,17,15,.035)] outline-none focus:border-accent focus:ring-3 focus:ring-accent/10" type="password" name="password" autoComplete="current-password" required minLength={8} maxLength={72} /></label>
        <button className="mt-1 min-h-14 rounded-[4px] bg-foreground px-5 text-sm font-bold text-background shadow-[0_12px_30px_rgba(16,17,15,.12)] hover:-translate-y-0.5 hover:bg-accent disabled:opacity-50" type="submit" disabled={!isSupabaseConfigured()}>Enter workspace <span className="ml-2" aria-hidden="true">→</span></button>
      </form>
    </AuthShell>
  );
}
