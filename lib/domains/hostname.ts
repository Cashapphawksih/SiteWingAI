import { domainToASCII } from "node:url";

import { getDomainRuntimeConfig } from "@/lib/domains/config";
import { publicSlugPattern } from "@/lib/publishing/slug";

const labelPattern = /^(?!-)[a-z0-9-]{1,63}(?<!-)$/;
const reservedSubdomains = new Set([
  "admin", "api", "app", "assets", "auth", "billing", "build", "dashboard",
  "docs", "help", "mail", "media", "status", "support", "www",
]);

export function normalizeHostname(input: string): string | null {
  let candidate = input.trim().toLowerCase();
  if (candidate.startsWith("[")) return null;
  candidate = candidate.replace(/:\d+$/, "").replace(/\.$/, "");
  const ascii = domainToASCII(candidate).toLowerCase();
  if (!ascii || ascii.length > 253 || ascii.includes("..")) return null;
  const labels = ascii.split(".");
  if (labels.some((label) => !labelPattern.test(label))) return null;
  return ascii;
}

export function normalizeCustomDomain(input: string): string | null {
  const withoutProtocol = input.trim().replace(/^https?:\/\//i, "").split(/[/?#]/, 1)[0];
  const hostname = normalizeHostname(withoutProtocol);
  if (!hostname || hostname === "localhost" || /^\d+(?:\.\d+){3}$/.test(hostname) || hostname.split(".").length < 2) return null;
  const { rootDomain, appHostnames } = getDomainRuntimeConfig();
  if (appHostnames.has(hostname) || hostname === rootDomain || hostname.endsWith(`.${rootDomain}`)) return null;
  return hostname;
}

export type HostResolution =
  | { kind: "main"; hostname: string }
  | { kind: "sitewing"; hostname: string; publicSlug: string }
  | { kind: "custom"; hostname: string }
  | { kind: "invalid" };

export function resolvePublishedSiteFromHost(rawHost: string | null): HostResolution {
  if (!rawHost) return { kind: "invalid" };
  const hostname = normalizeHostname(rawHost);
  if (!hostname) return { kind: "invalid" };
  const { rootDomain, appHostnames } = getDomainRuntimeConfig();
  if (appHostnames.has(hostname)) return { kind: "main", hostname };

  const localhostSuffix = ".localhost";
  const suffix = hostname.endsWith(localhostSuffix) ? localhostSuffix : `.${rootDomain}`;
  if (hostname.endsWith(suffix)) {
    const publicSlug = hostname.slice(0, -suffix.length);
    if (!publicSlug.includes(".") && publicSlugPattern.test(publicSlug) && !reservedSubdomains.has(publicSlug)) {
      return { kind: "sitewing", hostname, publicSlug };
    }
    return { kind: "main", hostname };
  }
  return { kind: "custom", hostname };
}

export function sitewingHostname(publicSlug: string): string {
  return `${publicSlug}.${getDomainRuntimeConfig().rootDomain}`;
}
