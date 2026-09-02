"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { safeReturnPath } from "@/lib/supabase/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

const credentialsSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(72),
});

function credentials(formData: FormData) {
  return credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
}

function safeErrorField(error: unknown, field: string): unknown {
  if (!error || (typeof error !== "object" && typeof error !== "function")) {
    return undefined;
  }
  try {
    return field in error
      ? (error as Record<string, unknown>)[field]
      : undefined;
  } catch {
    return undefined;
  }
}

function sanitizedAuthDiagnostic(value: unknown): string | number | undefined {
  if (typeof value === "number") return value;
  if (typeof value !== "string" || value.length === 0) return undefined;
  return value
    .slice(0, 1000)
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[REDACTED_EMAIL]")
    .replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, "[REDACTED_TOKEN]")
    .replace(/sb_(?:publishable|secret)_[A-Za-z0-9_-]+/g, "[REDACTED_SUPABASE_KEY]")
    .replace(/(authorization|apikey)(\s*[:=]\s*)[^\s,}]+/gi, "$1$2[REDACTED]");
}

function logSignupFailure(error: unknown, emailRedirectTo: string) {
  let redirectOrigin: string | null = null;
  let redirectPath: string | null = null;
  try {
    const redirectUrl = new URL(emailRedirectTo);
    redirectOrigin = redirectUrl.origin;
    redirectPath = redirectUrl.pathname;
  } catch {
    // A malformed callback remains visible as null diagnostic fields.
  }

  const constructorName =
    error && typeof error === "object"
      ? error.constructor?.name
      : undefined;
  console.error(
    "[auth:signup] Supabase signup failed",
    JSON.stringify({
      operation: "signup",
      errorName:
        sanitizedAuthDiagnostic(safeErrorField(error, "name")) ??
        constructorName ??
        typeof error,
      errorCode: sanitizedAuthDiagnostic(safeErrorField(error, "code")),
      status: sanitizedAuthDiagnostic(
        safeErrorField(error, "status") ??
          safeErrorField(error, "statusCode"),
      ),
      message: sanitizedAuthDiagnostic(
        safeErrorField(error, "message") ??
          (typeof error === "string" ? error : undefined),
      ),
      hasNextPublicSiteUrl: Boolean(process.env.NEXT_PUBLIC_SITE_URL?.trim()),
      emailRedirectToOrigin: redirectOrigin,
      emailRedirectToPath: redirectPath,
    }),
  );
}

export async function loginAction(formData: FormData) {
  if (!isSupabaseConfigured()) redirect("/login?error=configuration");
  const parsed = credentials(formData);
  const nextPath = safeReturnPath(
    typeof formData.get("next") === "string" ? String(formData.get("next")) : undefined,
  );
  if (!parsed.success) redirect(`/login?error=credentials&next=${encodeURIComponent(nextPath)}`);

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) redirect(`/login?error=credentials&next=${encodeURIComponent(nextPath)}`);

  revalidatePath("/", "layout");
  redirect(nextPath);
}

export async function signupAction(formData: FormData) {
  if (!isSupabaseConfigured()) redirect("/signup?error=configuration");
  const parsed = credentials(formData);
  if (!parsed.success) redirect("/signup?error=credentials");

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const emailRedirectTo = `${siteUrl.replace(/\/$/, "")}/auth/confirm`;
  const supabase = await createClient();
  let result: Awaited<ReturnType<typeof supabase.auth.signUp>>;
  try {
    result = await supabase.auth.signUp({
      ...parsed.data,
      options: { emailRedirectTo },
    });
  } catch (error: unknown) {
    logSignupFailure(error, emailRedirectTo);
    redirect("/signup?error=signup");
  }
  if (result.error) {
    logSignupFailure(result.error, emailRedirectTo);
    redirect("/signup?error=signup");
  }

  revalidatePath("/", "layout");
  redirect(result.data.session ? "/dashboard" : "/login?message=check-email");
}

export async function logoutAction() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  revalidatePath("/", "layout");
  redirect("/login");
}
