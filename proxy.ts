import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { SITEWING_NETLIFY_APP_HOSTNAME } from "@/lib/domains/config";
import {
  normalizeHostname,
  resolvePublishedSiteFromHost,
  type HostResolution,
} from "@/lib/domains/hostname";
import { updateSession } from "@/lib/supabase/proxy";

function safeDiagnosticValue(value: string | null, maxLength = 300) {
  if (!value) return null;
  return value
    .slice(0, maxLength)
    .replace(/[^\x20-\x7e]/g, "");
}

function logHostnameRoutingDiagnostic(input: {
  classification: HostResolution;
  forwardedHost: string | null;
  netlifyForwardedHost: string | null;
  nextUrlHostname: string;
  normalizedHostname: string | null;
  pathname: string;
  rawHost: string | null;
  rewriteToSiteHost: boolean;
}) {
  if (process.env.SITEWING_HOST_DIAGNOSTICS === "0") return;
  if (
    process.env.SITEWING_HOST_DIAGNOSTICS !== "1" &&
    input.normalizedHostname !== SITEWING_NETLIFY_APP_HOSTNAME
  ) {
    return;
  }
  console.info(
    "[sitewing:hostname-routing]",
    JSON.stringify({
      pathname: safeDiagnosticValue(input.pathname, 500),
      nextUrlHostname: safeDiagnosticValue(input.nextUrlHostname),
      rawHost: safeDiagnosticValue(input.rawHost),
      forwardedHost: safeDiagnosticValue(input.forwardedHost),
      netlifyForwardedHost: safeDiagnosticValue(input.netlifyForwardedHost),
      normalizedHostname: input.normalizedHostname,
      classification: input.classification.kind,
      rewriteToSiteHost: input.rewriteToSiteHost,
    }),
  );
}

export async function proxy(request: NextRequest) {
  const rawHost = request.headers.get("host");
  const forwardedHost = request.headers.get("x-forwarded-host");
  const netlifyForwardedHost =
    request.headers.get("x-nf-original-host") ??
    request.headers.get("x-netlify-original-host") ??
    request.headers.get("x-original-host");
  const normalizedHostname =
    normalizeHostname(rawHost ?? "") ??
    normalizeHostname(request.nextUrl.hostname);
  const isNetlifyApplicationHost =
    normalizedHostname === SITEWING_NETLIFY_APP_HOSTNAME;
  const hostResolution: HostResolution = isNetlifyApplicationHost
    ? { kind: "main", hostname: SITEWING_NETLIFY_APP_HOSTNAME }
    : resolvePublishedSiteFromHost(rawHost ?? request.nextUrl.hostname);
  const isPublicMedia = request.nextUrl.pathname.startsWith("/api/public-sites/");
  const isInternalDomainRoute = request.nextUrl.pathname === "/site-host" || request.nextUrl.pathname.startsWith("/site-host/");
  const rewriteToSiteHost =
    !isNetlifyApplicationHost &&
    (hostResolution.kind === "sitewing" || hostResolution.kind === "custom") &&
    !isPublicMedia &&
    !isInternalDomainRoute;
  logHostnameRoutingDiagnostic({
    classification: hostResolution,
    forwardedHost,
    netlifyForwardedHost,
    nextUrlHostname: request.nextUrl.hostname,
    normalizedHostname,
    pathname: request.nextUrl.pathname,
    rawHost,
    rewriteToSiteHost,
  });
  if (rewriteToSiteHost) {
    const destination = request.nextUrl.clone();
    destination.pathname = `/site-host${request.nextUrl.pathname === "/" ? "" : request.nextUrl.pathname}`;
    return NextResponse.rewrite(destination);
  }
  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
