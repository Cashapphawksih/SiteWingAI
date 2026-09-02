import { NextResponse } from "next/server";
import { z } from "zod";

import { normalizeCustomDomain } from "@/lib/domains/hostname";
import { NetlifyDomainProvider } from "@/lib/domains/netlify-provider";
import { serializeDomain } from "@/lib/domains/serialization";
import { getOwnedProject } from "@/lib/projects/server";
import { createAdminClient } from "@/lib/supabase/admin";

const inputSchema = z.object({ hostname: z.string().trim().min(1).max(300) }).strict();

function errorResponse(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const owned = await getOwnedProject(projectId);
  if (!owned.ok) return errorResponse(owned.status, owned.code, owned.message);
  const body = inputSchema.safeParse(await request.json().catch(() => null));
  const hostname = body.success ? normalizeCustomDomain(body.data.hostname) : null;
  if (!hostname) return errorResponse(422, "invalid_domain", "Enter a valid custom domain that is not reserved by SiteWing.");

  let instructions;
  const verificationToken = `swv_${Array.from(crypto.getRandomValues(new Uint8Array(24)), (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
  try {
    instructions = new NetlifyDomainProvider().getDnsInstructions(hostname, verificationToken);
  } catch {
    return errorResponse(503, "domain_provider_unconfigured", "Custom domain connection is not configured yet.");
  }

  const admin = createAdminClient();
  const { data, error } = await admin.from("domains").insert({
    project_id: projectId,
    user_id: owned.project.user_id,
    hostname,
    type: "custom",
    status: "pending",
    verification_token: verificationToken,
  }).select("*").single();
  if (error) {
    const duplicate = error.code === "23505";
    console.error("[domains:create] insert failed", { code: error.code, projectId });
    return errorResponse(duplicate ? 409 : 503, duplicate ? "domain_claimed" : "domain_unavailable", duplicate ? "That domain is already connected to a SiteWing project." : "The domain could not be connected right now.");
  }
  return NextResponse.json({ domain: serializeDomain(data), instructions }, { status: 201, headers: { "Cache-Control": "no-store" } });
}
