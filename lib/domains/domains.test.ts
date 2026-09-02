import assert from "node:assert/strict";
import test from "node:test";
import {
  getRewrittenUrl,
  isRewrite,
} from "next/experimental/testing/server";
import { NextRequest } from "next/server";

import {
  evaluateDomainDns,
  type DomainDnsResolver,
} from "@/lib/domains/dns-verification-core";
import { normalizeCustomDomain, resolvePublishedSiteFromHost } from "@/lib/domains/hostname";
import { proxy } from "@/proxy";

process.env.SITEWING_ROOT_DOMAIN = "sitewing.ai";
process.env.SITEWING_HOST_DIAGNOSTICS = "0";
process.env.SITEWING_APP_HOSTNAMES = "sitewingai.netlify.app";
process.env.SITEWING_PUBLIC_ORIGIN = "https://sitewingai.netlify.app";
process.env.NEXT_PUBLIC_SITE_URL = "https://sitewingai.netlify.app";
process.env.NEXT_PUBLIC_SUPABASE_URL = "";
process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "";
process.env.NETLIFY_CUSTOM_DOMAIN_TARGET = "sitewing-app.netlify.app";
process.env.NETLIFY_APEX_DOMAIN_TARGET = "apex-loadbalancer.netlify.com";
process.env.NETLIFY_APEX_FALLBACK_IP = "75.2.60.5";
process.env.NETLIFY_SITE_ID = "test-site";
process.env.NETLIFY_AUTH_TOKEN = "test-token";

const targets = {
  customDomainTarget: "sitewing-app.netlify.app",
  apexDomainTarget: "apex-loadbalancer.netlify.com",
  apexFallbackIp: "75.2.60.5",
};

test("normalizes IDNs and rejects SiteWing-owned domains", () => {
  assert.equal(normalizeCustomDomain("https://BÜCHER.example/path"), "xn--bcher-kva.example");
  assert.equal(normalizeCustomDomain("support.sitewing.ai"), null);
});

test("resolves SiteWing, reserved, custom, and localhost hosts", () => {
  assert.equal(resolvePublishedSiteFromHost("sitewingai.netlify.app").kind, "main");
  assert.deepEqual(resolvePublishedSiteFromHost("apex-roofing.sitewing.ai:443"), { kind: "sitewing", hostname: "apex-roofing.sitewing.ai", publicSlug: "apex-roofing" });
  assert.equal(resolvePublishedSiteFromHost("support.sitewing.ai").kind, "main");
  assert.deepEqual(resolvePublishedSiteFromHost("apex-roofing.localhost:3000"), { kind: "sitewing", hostname: "apex-roofing.localhost", publicSlug: "apex-roofing" });
  assert.deepEqual(resolvePublishedSiteFromHost("www.customer.com"), { kind: "custom", hostname: "www.customer.com" });
});

test("keeps the Netlify application hostname on application routes", async () => {
  const configuredHostnames = process.env.SITEWING_APP_HOSTNAMES;
  const publicOrigin = process.env.SITEWING_PUBLIC_ORIGIN;
  const publicSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  process.env.SITEWING_APP_HOSTNAMES = "";
  process.env.SITEWING_PUBLIC_ORIGIN = "";
  process.env.NEXT_PUBLIC_SITE_URL = "";
  delete process.env.URL;
  delete process.env.SITE_NAME;
  try {
    for (const pathname of [
      "/",
      "/login?error=credentials&next=%2Fbuild",
      "/signup",
      "/dashboard",
      "/build",
      "/build/11111111-1111-4111-8111-111111111111",
      "/api/generate-site",
    ]) {
      const request = new NextRequest(`https://sitewingai.netlify.app${pathname}`, {
        headers: { host: "sitewingai.netlify.app" },
      });
      const response = await proxy(request);
      assert.equal(isRewrite(response), false, `${pathname} must not be rewritten`);
    }
  } finally {
    process.env.SITEWING_APP_HOSTNAMES = configuredHostnames;
    process.env.SITEWING_PUBLIC_ORIGIN = publicOrigin;
    process.env.NEXT_PUBLIC_SITE_URL = publicSiteUrl;
  }
});

test("still rewrites a simulated customer subdomain to the published-site route", async () => {
  const request = new NextRequest("http://apex-roofing.localhost:3000/services", {
    headers: { host: "apex-roofing.localhost:3000" },
  });
  const response = await proxy(request);
  assert.equal(isRewrite(response), true);
  const rewrittenUrl = getRewrittenUrl(response);
  assert.ok(rewrittenUrl);
  assert.equal(
    new URL(rewrittenUrl).pathname,
    "/site-host/services",
  );
});

test("requires exact TXT ownership and the configured CNAME", async () => {
  const resolver: DomainDnsResolver = {
    resolveTxt: async () => [["swv_exact-token"]],
    resolveCname: async () => ["sitewing-app.netlify.app"],
    resolve4: async () => [],
  };
  assert.deepEqual(await evaluateDomainDns("www.customer.com", "swv_exact-token", targets, resolver), { ownership: true, routing: true });
  assert.deepEqual(await evaluateDomainDns("www.customer.com", "swv_wrong-token", targets, resolver), { ownership: false, routing: true });
});

test("accepts the configured apex fallback address", async () => {
  const resolver: DomainDnsResolver = {
    resolveTxt: async () => [["swv_exact-token"]],
    resolveCname: async () => [],
    resolve4: async (hostname) => hostname === "customer.com" ? ["75.2.60.5"] : ["99.99.99.99"],
  };
  assert.deepEqual(await evaluateDomainDns("customer.com", "swv_exact-token", targets, resolver), { ownership: true, routing: true });
});
