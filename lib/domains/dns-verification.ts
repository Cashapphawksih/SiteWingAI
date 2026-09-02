import "server-only";

import { resolve4, resolveCname, resolveTxt } from "node:dns/promises";

import { getNetlifyDomainConfig } from "@/lib/domains/config";
import {
  evaluateDomainDns,
  type DomainDnsResolver,
} from "@/lib/domains/dns-verification-core";

export type { DomainDnsResolver } from "@/lib/domains/dns-verification-core";

const nodeDnsResolver: DomainDnsResolver = { resolve4, resolveCname, resolveTxt };

export async function verifyDomainDns(hostname: string, verificationToken: string, resolver: DomainDnsResolver = nodeDnsResolver): Promise<{ ownership: boolean; routing: boolean }> {
  return evaluateDomainDns(
    hostname,
    verificationToken,
    getNetlifyDomainConfig(),
    resolver,
  );
}
