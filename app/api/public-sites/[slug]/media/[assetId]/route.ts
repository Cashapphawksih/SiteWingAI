import { NextResponse } from "next/server";
import { z } from "zod";

import { publicSlugPattern } from "@/lib/publishing/slug";
import { createAdminClient } from "@/lib/supabase/admin";
import { SITE_MEDIA_BUCKET } from "@/lib/media/storage-media";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string; assetId: string }> }) {
  const { slug, assetId } = await params;
  if (!publicSlugPattern.test(slug) || !z.string().uuid().safeParse(assetId).success) return new NextResponse("Not found", { status: 404 });
  try {
    const supabase = createAdminClient();
    const { data: site } = await supabase.from("published_sites").select("project_id").eq("public_slug", slug).eq("is_active", true).maybeSingle();
    if (!site) return new NextResponse("Not found", { status: 404 });
    const { data: asset } = await supabase.from("published_site_assets").select("storage_path").eq("project_id", site.project_id).eq("asset_id", assetId).maybeSingle();
    if (!asset) return new NextResponse("Not found", { status: 404 });
    const { data: blob, error } = await supabase.storage.from(SITE_MEDIA_BUCKET).download(asset.storage_path);
    if (error || !blob) return new NextResponse("Not found", { status: 404 });
    return new NextResponse(blob, { headers: { "Cache-Control": "private, no-store", "Content-Type": blob.type || "application/octet-stream", "X-Content-Type-Options": "nosniff" } });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
