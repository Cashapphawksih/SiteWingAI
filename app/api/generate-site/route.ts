import { z } from "zod";

import {
  generateWebsiteConfig,
  WebsiteGenerationError,
} from "@/lib/ai/generate-website";
import { getOwnedProject, persistProjectMessage } from "@/lib/projects/server";

export const runtime = "nodejs";

const MAX_REQUEST_BYTES = 12000;
const generateSiteRequestSchema = z
  .object({
    projectId: z.string().uuid(),
    prompt: z.string().trim().min(20).max(4000),
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
      "The website description is too large.",
    );
  }

  let requestBody: unknown;
  try {
    requestBody = await request.json();
  } catch {
    return errorResponse(
      400,
      "invalid_json",
      "Send a valid JSON object containing a prompt.",
    );
  }

  const parsedRequest = generateSiteRequestSchema.safeParse(requestBody);
  if (!parsedRequest.success) {
    return errorResponse(
      400,
      "invalid_prompt",
      "Describe the business in 20 to 4,000 characters.",
    );
  }

  const ownership = await getOwnedProject(parsedRequest.data.projectId);
  if (!ownership.ok) {
    return errorResponse(ownership.status, ownership.code, ownership.message);
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
    const config = await generateWebsiteConfig(parsedRequest.data.prompt);

    const assistantSaved = await persistProjectMessage(
      ownership.project.id,
      "assistant",
      "Your site is ready.",
    );
    if (!assistantSaved) {
      console.error("[generate-site] generated response message was not persisted", {
        projectId: ownership.project.id,
      });
    }

    return Response.json(
      { config },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error: unknown) {
    if (error instanceof WebsiteGenerationError) {
      console.error("[generate-site] generation failed", {
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

    console.error("[generate-site] unexpected generation failure");
    await persistProjectMessage(
      ownership.project.id,
      "assistant",
      "SiteWing could not generate the website. Please try again.",
    );
    return errorResponse(
      500,
      "generation_failed",
      "SiteWing could not generate the website. Please try again.",
    );
  }
}
