export interface DomainRuntimeConfig {
  rootDomain: string;
  publicOrigin: string;
  appHostnames: Set<string>;
}

export const SITEWING_NETLIFY_APP_HOSTNAME = "sitewingai.netlify.app";

function normalizedEnvHostname(value: string): string {
  return value.trim().toLowerCase().replace(/\.$/, "");
}

function hostnameFromConfiguredUrl(value: string | undefined): string | null {
  if (!value?.trim()) return null;
  try {
    const url = new URL(
      value.includes("://") ? value.trim() : `https://${value.trim()}`,
    );
    return normalizedEnvHostname(url.hostname);
  } catch {
    return null;
  }
}

export function getDomainRuntimeConfig(): DomainRuntimeConfig {
  const rootDomain = normalizedEnvHostname(process.env.SITEWING_ROOT_DOMAIN || "sitewing.ai");
  const publicOrigin = process.env.SITEWING_PUBLIC_ORIGIN || `https://${rootDomain}`;
  const configuredAppHostnames = (process.env.SITEWING_APP_HOSTNAMES || "")
    .split(",")
    .map(hostnameFromConfiguredUrl)
    .filter((hostname): hostname is string => Boolean(hostname));
  const netlifySiteHostname = process.env.SITE_NAME
    ? hostnameFromConfiguredUrl(`${process.env.SITE_NAME}.netlify.app`)
    : null;
  const appHostnames = new Set([
    rootDomain,
    `www.${rootDomain}`,
    SITEWING_NETLIFY_APP_HOSTNAME,
    "localhost",
    "127.0.0.1",
    ...configuredAppHostnames,
    hostnameFromConfiguredUrl(publicOrigin),
    hostnameFromConfiguredUrl(process.env.NEXT_PUBLIC_SITE_URL),
    hostnameFromConfiguredUrl(process.env.URL),
    hostnameFromConfiguredUrl(process.env.DEPLOY_URL),
    hostnameFromConfiguredUrl(process.env.DEPLOY_PRIME_URL),
    netlifySiteHostname,
  ].filter((hostname): hostname is string => Boolean(hostname)));
  return { rootDomain, publicOrigin, appHostnames };
}

export interface NetlifyDomainConfig {
  siteId: string;
  authToken: string;
  customDomainTarget: string;
  apexDomainTarget: string;
  apexFallbackIp: string;
}

export function getNetlifyDomainConfig(): NetlifyDomainConfig {
  const siteId = process.env.NETLIFY_SITE_ID;
  const authToken = process.env.NETLIFY_AUTH_TOKEN;
  const customDomainTarget = process.env.NETLIFY_CUSTOM_DOMAIN_TARGET;
  const apexDomainTarget = process.env.NETLIFY_APEX_DOMAIN_TARGET;
  const apexFallbackIp = process.env.NETLIFY_APEX_FALLBACK_IP;
  if (!siteId || !authToken || !customDomainTarget || !apexDomainTarget || !apexFallbackIp) {
    throw new Error("Netlify domain management is not configured.");
  }
  return { siteId, authToken, customDomainTarget, apexDomainTarget, apexFallbackIp };
}
