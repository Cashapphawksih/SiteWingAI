import { z } from "zod";

import {
  refineWebsiteConfig,
  WebsiteRefinementError,
} from "@/lib/ai/refine-website";
import { parseWebsiteConfigInput } from "@/lib/ai/website-config-schema";
import { getOwnedProject, persistProjectMessage } from "@/lib/projects/server";
import type { WebsiteConfig } from "@/types/website";

export const runtime = "nodejs";

const MAX_REQUEST_BYTES = 100_000;
const refineSiteRequestSchema = z
  .object({
    projectId: z.string().uuid(),
    prompt: z.string().trim().min(3).max(2000),
    currentConfig: z.unknown(),
  })
  .strict();

function errorResponse(status: number, code: string, message: string) {
  return Response.json(
    { error: { code, message } },
    {
      status,
      headers: { "Cache-Control": "no-store" },
    },
  );
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);

  if (contentLength > MAX_REQUEST_BYTES) {
    return errorResponse(
      413,
      "request_too_large",
      "The refinement request is too large.",
    );
  }

  let requestBody: unknown;
  try {
    requestBody = await request.json();
  } catch {
    return errorResponse(
      400,
      "invalid_json",
      "Send a valid JSON object containing a prompt and currentConfig.",
    );
  }

  const parsedRequest = refineSiteRequestSchema.safeParse(requestBody);
  if (!parsedRequest.success) {
    return errorResponse(
      400,
      "invalid_request",
      "Provide an edit instruction between 3 and 2,000 characters and the current website configuration.",
    );
  }

  const ownership = await getOwnedProject(parsedRequest.data.projectId);
  if (!ownership.ok) {
    return errorResponse(ownership.status, ownership.code, ownership.message);
  }

  let currentConfig: WebsiteConfig;
  try {
    currentConfig = parseWebsiteConfigInput(parsedRequest.data.currentConfig);
  } catch {
    return errorResponse(
      422,
      "invalid_current_config",
      "The current website configuration is invalid and cannot be refined.",
    );
  }

  const messageSaved = await persistProjectMessage(
    ownership.project.id,
    "user",
    parsedRequest.data.prompt,
  );
  if (!messageSaved) {
    return errorResponse(
      503,
      "message_persistence_failed",
      "Your request could not be saved. Please try again.",
    );
  }

  try {
    const result = await refineWebsiteConfig(
      currentConfig,
      parsedRequest.data.prompt,
    );

    console.info("[refine-site] refinement completed", result.metadata);

    const assistantSaved = await persistProjectMessage(
      ownership.project.id,
      "assistant",
      "Your site has been updated.",
    );
    if (!assistantSaved) {
      console.error("[refine-site] refined response message was not persisted", {
        projectId: ownership.project.id,
      });
    }

    return Response.json(
      { config: result.config },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error: unknown) {
    if (error instanceof WebsiteRefinementError) {
      console.error("[refine-site] refinement failed", {
        code: error.code,
        status: error.status,
        requestId: error.requestId,
      });

      await persistProjectMessage(
        ownership.project.id,
        "assistant",
        error.safeMessage,
      );
      return errorResponse(error.status, error.code, error.safeMessage);
    }

    console.error("[refine-site] unexpected refinement failure");
    await persistProjectMessage(
      ownership.project.id,
      "assistant",
      "SiteWing could not refine the website. Please try again.",
    );
    return errorResponse(
      500,
      "refinement_failed",
      "SiteWing could not refine the website. Please try again.",
    );
  }
}
