import "server-only";

import { getDomain } from "tldts";

import { getNetlifyDomainConfig } from "@/lib/domains/config";
import { DomainProviderError, type DomainProvider } from "@/lib/domains/provider";
import type { DnsInstruction } from "@/types/domain";

interface NetlifySiteResponse {
  domain_aliases?: unknown;
}

function sanitizedProviderMessage(value: unknown): string {
  if (typeof value !== "string") return "Netlify rejected the domain request.";
  return value.slice(0, 300).replace(/Bearer\s+\S+/gi, "Bearer [REDACTED]");
}

export class NetlifyDomainProvider implements DomainProvider {
  private async request(method: "GET" | "PATCH", body?: Record<string, unknown>): Promise<NetlifySiteResponse> {
    const { siteId, authToken } = getNetlifyDomainConfig();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    try {
      const response = await fetch(`https://api.netlify.com/api/v1/sites/${encodeURIComponent(siteId)}`, {
        method,
        headers: { Authorization: `Bearer ${authToken}`, "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
        cache: "no-store",
        signal: controller.signal,
      });
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        const message = payload && typeof payload === "object" && "message" in payload ? (payload as { message?: unknown }).message : undefined;
        throw new DomainProviderError(`netlify_${response.status}`, sanitizedProviderMessage(message));
      }
      return payload && typeof payload === "object" ? payload as NetlifySiteResponse : {};
    } catch (error: unknown) {
      if (error instanceof DomainProviderError) throw error;
      throw new DomainProviderError("netlify_unavailable", error instanceof Error && error.name === "AbortError" ? "Netlify timed out." : "Netlify is temporarily unavailable.");
    } finally {
      clearTimeout(timeout);
    }
  }

  private aliases(site: NetlifySiteResponse): string[] {
    return Array.isArray(site.domain_aliases) ? site.domain_aliases.filter((value): value is string => typeof value === "string") : [];
  }

  async addDomain(hostname: string): Promise<void> {
    const site = await this.request("GET");
    const aliases = [...new Set([...this.aliases(site), hostname])];
    const updated = await this.request("PATCH", { domain_aliases: aliases });
    if (!this.aliases(updated).includes(hostname)) throw new DomainProviderError("netlify_alias_missing", "Netlify did not confirm the domain alias.");
  }

  async removeDomain(hostname: string): Promise<void> {
    const site = await this.request("GET");
    const aliases = this.aliases(site).filter((alias) => alias !== hostname);
    const updated = await this.request("PATCH", { domain_aliases: aliases });
    if (this.aliases(updated).includes(hostname)) throw new DomainProviderError("netlify_alias_removal_failed", "Netlify did not remove the domain alias.");
  }

  async checkDomain(hostname: string): Promise<boolean> {
    return this.aliases(await this.request("GET")).includes(hostname);
  }

  getDnsInstructions(hostname: string, verificationToken: string): DnsInstruction[] {
    const { customDomainTarget, apexDomainTarget, apexFallbackIp } = getNetlifyDomainConfig();
    const isApex = getDomain(hostname, { allowPrivateDomains: false }) === hostname;
    const routing: DnsInstruction[] = isApex
      ? [
          { purpose: "routing", type: "ALIAS", host: "@", value: apexDomainTarget },
          { purpose: "routing", type: "A", host: "@", value: apexFallbackIp },
        ]
      : [{ purpose: "routing", type: "CNAME", host: hostname, value: customDomainTarget }];
    return [
      { purpose: "ownership", type: "TXT", host: `_sitewing-verification.${hostname}`, value: verificationToken },
      ...routing,
    ];
  }
}
