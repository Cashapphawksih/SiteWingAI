import { NextResponse } from "next/server";
import { z } from "zod";

import { verifyDomainDns } from "@/lib/domains/dns-verification";
import { DomainProviderError } from "@/lib/domains/provider";
import { NetlifyDomainProvider } from "@/lib/domains/netlify-provider";
import { serializeDomain } from "@/lib/domains/serialization";
import { getOwnedProject } from "@/lib/projects/server";
import { createAdminClient } from "@/lib/supabase/admin";

const actionSchema = z.object({ action: z.literal("verify") }).strict();

function errorResponse(status: number, code: string, message: string, domain?: ReturnType<typeof serializeDomain>) {
  return NextResponse.json({ error: { code, message }, domain }, { status, headers: { "Cache-Control": "no-store" } });
}

async function getOwnedDomain(projectId: string, domainId: string, userId: string) {
  if (!z.string().uuid().safeParse(domainId).success) return null;
  const admin = createAdminClient();
  const { data } = await admin.from("domains").select("*").eq("id", domainId).eq("project_id", projectId).eq("user_id", userId).eq("type", "custom").maybeSingle();
  return data;
}

export async function POST(request: Request, { params }: { params: Promise<{ projectId: string; domainId: string }> }) {
  const { projectId, domainId } = await params;
  const owned = await getOwnedProject(projectId);
  if (!owned.ok) return errorResponse(owned.status, owned.code, owned.message);
  if (!actionSchema.safeParse(await request.json().catch(() => null)).success) return errorResponse(400, "invalid_action", "Choose a valid domain action.");
  const domain = await getOwnedDomain(projectId, domainId, owned.project.user_id);
  if (!domain) return errorResponse(404, "domain_not_found", "The custom domain was not found.");

  const admin = createAdminClient();
  await admin.from("domains").update({ status: "verifying", last_error: null }).eq("id", domain.id).eq("user_id", owned.project.user_id);
  try {
    const dns = await verifyDomainDns(domain.hostname, domain.verification_token);
    if (!dns.ownership || !dns.routing) {
      const message = !dns.ownership ? "The verification TXT record was not found yet." : "The domain is not pointing to SiteWing yet.";
      const { data } = await admin.from("domains").update({ status: "pending", last_error: message }).eq("id", domain.id).eq("user_id", owned.project.user_id).select("*").single();
      return errorResponse(409, "dns_pending", message, data ? serializeDomain(data) : undefined);
    }
    const provider = new NetlifyDomainProvider();
    await provider.addDomain(domain.hostname);
    if (!(await provider.checkDomain(domain.hostname))) throw new DomainProviderError("provider_pending", "Netlify has not confirmed the domain yet.");
    const now = new Date().toISOString();
    const { data, error } = await admin.from("domains").update({ status: "active", verified_at: now, provider_synced_at: now, last_error: null }).eq("id", domain.id).eq("user_id", owned.project.user_id).select("*").single();
    if (error || !data) throw new Error("Domain status could not be saved.");
    return NextResponse.json({ domain: serializeDomain(data) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error: unknown) {
    const safeMessage = error instanceof DomainProviderError ? error.message : "Domain verification is temporarily unavailable.";
    const { data } = await admin.from("domains").update({ status: "error", last_error: safeMessage }).eq("id", domain.id).eq("user_id", owned.project.user_id).select("*").single();
    console.error("[domains:verify] verification failed", { name: error instanceof Error ? error.name : "UnknownError", projectId, domainId });
    return errorResponse(503, "domain_verification_failed", safeMessage, data ? serializeDomain(data) : undefined);
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ projectId: string; domainId: string }> }) {
  const { projectId, domainId } = await params;
  const owned = await getOwnedProject(projectId);
  if (!owned.ok) return errorResponse(owned.status, owned.code, owned.message);
  const domain = await getOwnedDomain(projectId, domainId, owned.project.user_id);
  if (!domain) return errorResponse(404, "domain_not_found", "The custom domain was not found.");
  try {
    if (domain.provider_synced_at) {
      const provider = new NetlifyDomainProvider();
      if (await provider.checkDomain(domain.hostname)) {
        await provider.removeDomain(domain.hostname);
      }
    }
    const admin = createAdminClient();
    const { error } = await admin.from("domains").delete().eq("id", domain.id).eq("project_id", projectId).eq("user_id", owned.project.user_id);
    if (error) throw error;
    return new NextResponse(null, { status: 204 });
  } catch (error: unknown) {
    console.error("[domains:remove] removal failed", { name: error instanceof Error ? error.name : "UnknownError", projectId, domainId });
    return errorResponse(503, "domain_removal_failed", "The domain could not be disconnected safely. Please try again.");
  }
}
