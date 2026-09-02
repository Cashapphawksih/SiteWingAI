import "server-only";

import { cache } from "react";

import { parseWebsiteConfigInput } from "@/lib/ai/website-config-schema";
import { publicSlugPattern } from "@/lib/publishing/slug";
import { createAdminClient } from "@/lib/supabase/admin";
import type { WebsiteConfig } from "@/types/website";

export interface PublicSiteSnapshot {
  config: WebsiteConfig;
  projectId?: string;
  publicSlug: string;
  publishedAt: string;
}

function safeErrorField(error: unknown, field: string): unknown {
  if (!error || (typeof error !== "object" && typeof error !== "function")) return undefined;
  try {
    return field in error ? (error as Record<string, unknown>)[field] : undefined;
  } catch {
    return undefined;
  }
}

function sanitizeDiagnostic(value: unknown): string | number | undefined {
  if (typeof value === "number") return value;
  if (typeof value !== "string" || value.length === 0) return undefined;
  return value
    .slice(0, 1000)
    .replace(/sb_secret_[A-Za-z0-9_-]+/g, "[REDACTED_SUPABASE_SECRET]")
    .replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, "[REDACTED_JWT]")
    .replace(/(authorization|apikey)(\s*[:=]\s*)[^\s,}]+/gi, "$1$2[REDACTED]");
}

function logPublicSiteError(label: string, error: unknown) {
  const constructorName = error && typeof error === "object" ? error.constructor?.name : undefined;
  const diagnostic = {
    name: sanitizeDiagnostic(safeErrorField(error, "name")) ?? constructorName ?? typeof error,
    code: sanitizeDiagnostic(safeErrorField(error, "code")),
    status: sanitizeDiagnostic(safeErrorField(error, "status") ?? safeErrorField(error, "statusCode")),
    type: sanitizeDiagnostic(safeErrorField(error, "type")),
    message: sanitizeDiagnostic(safeErrorField(error, "message") ?? (typeof error === "string" ? error : undefined)),
    details: sanitizeDiagnostic(safeErrorField(error, "details")),
    hint: sanitizeDiagnostic(safeErrorField(error, "hint")),
    requestId: sanitizeDiagnostic(safeErrorField(error, "requestId") ?? safeErrorField(error, "request_id")),
  };
  console.error(label, JSON.stringify(diagnostic));
}

export const getPublicSite = cache(async (publicSlug: string): Promise<PublicSiteSnapshot | null> => {
  if (!publicSlugPattern.test(publicSlug)) return null;
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("published_sites")
      .select("public_slug, published_config, published_at")
      .eq("public_slug", publicSlug)
      .eq("is_active", true)
      .maybeSingle();
    if (error || !data) {
      if (error) logPublicSiteError("[public-site:load] snapshot lookup failed", error);
      return null;
    }
    return { config: parseWebsiteConfigInput(data.published_config), publicSlug: data.public_slug, publishedAt: data.published_at };
  } catch (error: unknown) {
    logPublicSiteError("[public-site:load] snapshot unavailable", error);
    return null;
  }
});

export const getPublicSiteByHostname = cache(async (hostname: string): Promise<PublicSiteSnapshot | null> => {
  try {
    const supabase = createAdminClient();
    const { data: domain, error: domainError } = await supabase
      .from("domains")
      .select("project_id")
      .eq("hostname", hostname)
      .eq("type", "custom")
      .eq("status", "active")
      .maybeSingle();
    if (domainError || !domain) {
      if (domainError) logPublicSiteError("[public-site:host] domain lookup failed", domainError);
      return null;
    }
    const { data: site, error: siteError } = await supabase
      .from("published_sites")
      .select("project_id, public_slug, published_config, published_at")
      .eq("project_id", domain.project_id)
      .eq("is_active", true)
      .maybeSingle();
    if (siteError || !site) {
      if (siteError) logPublicSiteError("[public-site:host] snapshot lookup failed", siteError);
      return null;
    }
    return { config: parseWebsiteConfigInput(site.published_config), projectId: site.project_id, publicSlug: site.public_slug, publishedAt: site.published_at };
  } catch (error: unknown) {
    logPublicSiteError("[public-site:host] resolution unavailable", error);
    return null;
  }
});
