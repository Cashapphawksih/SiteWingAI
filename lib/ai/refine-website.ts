import "server-only";

import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";

import { SITEWING_REFINEMENT_INSTRUCTIONS } from "@/lib/ai/sitewing-refinement-instructions";
import { collectStorageMedia } from "@/lib/media/storage-media";
import {
  aiWebsiteConfigSchema,
  parseAIWebsiteConfig,
} from "@/lib/ai/website-config-schema";
import { assertValidWebsiteConfig } from "@/lib/website-config";
import type { WebsiteConfig } from "@/types/website";

const SITEWING_MODEL = "gpt-5.4-mini";
const MAX_DIAGNOSTIC_MESSAGE_LENGTH = 600;
const WEBSITE_CONFIG_TEXT_FORMAT = zodTextFormat(
  aiWebsiteConfigSchema,
  "website_config",
  {
    description:
      "A complete refined SiteWing WebsiteConfig using only supported sections.",
  },
);

export type WebsiteRefinementErrorCode =
  | "missing_api_key"
  | "rate_limited"
  | "openai_authentication"
  | "openai_unavailable"
  | "invalid_model_output";

export interface WebsiteRefinementMetadata {
  operation: "refinement";
  model: string;
  durationMs: number;
  usage: {
    inputTokens: number | null;
    outputTokens: number | null;
    totalTokens: number | null;
  };
}

export interface WebsiteRefinementResult {
  config: WebsiteConfig;
  metadata: WebsiteRefinementMetadata;
}

export class WebsiteRefinementError extends Error {
  constructor(
    readonly code: WebsiteRefinementErrorCode,
    readonly status: number,
    readonly safeMessage: string,
    readonly requestId?: string,
  ) {
    super(safeMessage);
    this.name = "WebsiteRefinementError";
  }
}

function sanitizeDiagnosticMessage(message: string): string {
  return message
    .replace(/\bBearer\s+[A-Za-z0-9._~+/=-]+/gi, "Bearer [REDACTED]")
    .replace(/\bsk-[A-Za-z0-9_-]{8,}\b/g, "[REDACTED_API_KEY]")
    .replace(
      /\b(api[_-]?key|authorization)\s*[:=]\s*[^\s,;]+/gi,
      "$1=[REDACTED]",
    )
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_DIAGNOSTIC_MESSAGE_LENGTH);
}

function logOpenAIRefinementError(error: unknown): void {
  const apiError = error instanceof OpenAI.APIError ? error : undefined;
  const errorName = error instanceof Error ? error.name : typeof error;
  const rawMessage =
    error instanceof Error ? error.message : "Unknown OpenAI refinement error";

  console.error("[sitewing:openai-refinement-error]", {
    errorName,
    httpStatus: apiError?.status ?? null,
    openaiCode: apiError?.code ?? null,
    errorType: apiError?.type ?? null,
    message: sanitizeDiagnosticMessage(rawMessage),
    requestId: apiError?.requestID ?? null,
  });
}

function getRefinementInput(
  currentConfig: WebsiteConfig,
  prompt: string,
): string {
  return JSON.stringify({
    task: "Refine the current WebsiteConfig according to the edit request.",
    editRequest: prompt,
    currentConfig,
  });
}

function preservesPersistentMedia(currentConfig: WebsiteConfig, nextConfig: WebsiteConfig, prompt: string): boolean {
  const currentMedia = collectStorageMedia(currentConfig);
  const nextMedia = collectStorageMedia(nextConfig);
  const explicitlyRemovesMedia = /\b(remove|delete)\b.{0,40}\b(image|photo|media|gallery)\b|\b(image|photo|media|gallery)\b.{0,40}\b(remove|delete)\b/i.test(prompt);

  for (const [path, next] of nextMedia) {
    const current = currentMedia.get(path);
    if (!current) return false;
    if (
      next.source !== current.source ||
      next.src !== current.src ||
      next.storagePath !== current.storagePath ||
      next.mimeType !== current.mimeType ||
      next.width !== current.width ||
      next.height !== current.height
    ) return false;
  }
  if (!explicitlyRemovesMedia && currentMedia.size !== nextMedia.size) return false;
  if (!explicitlyRemovesMedia) {
    for (const path of currentMedia.keys()) if (!nextMedia.has(path)) return false;
  }
  return true;
}

export async function refineWebsiteConfig(
  currentConfig: WebsiteConfig,
  prompt: string,
): Promise<WebsiteRefinementResult> {
  assertValidWebsiteConfig(currentConfig);

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new WebsiteRefinementError(
      "missing_api_key",
      503,
      "Website refinement is not configured yet. Add OPENAI_API_KEY to the server environment.",
    );
  }

  const openai = new OpenAI({ apiKey });
  const startedAt = performance.now();
  let response: Awaited<ReturnType<typeof openai.responses.parse>>;

  try {
    response = await openai.responses.parse({
      model: SITEWING_MODEL,
      instructions: SITEWING_REFINEMENT_INSTRUCTIONS,
      input: getRefinementInput(currentConfig, prompt),
      store: false,
      max_output_tokens: 24000,
      reasoning: { effort: "low" },
      text: { format: WEBSITE_CONFIG_TEXT_FORMAT },
    });
  } catch (error: unknown) {
    logOpenAIRefinementError(error);

    if (error instanceof OpenAI.RateLimitError) {
      throw new WebsiteRefinementError(
        "rate_limited",
        429,
        "Website refinement is temporarily busy. Please wait a moment and try again.",
        error.requestID ?? undefined,
      );
    }

    if (error instanceof OpenAI.AuthenticationError) {
      throw new WebsiteRefinementError(
        "openai_authentication",
        503,
        "Website refinement could not authenticate with OpenAI. Check the server API key.",
        error.requestID ?? undefined,
      );
    }

    if (error instanceof OpenAI.APIError) {
      throw new WebsiteRefinementError(
        "openai_unavailable",
        502,
        "OpenAI could not refine the website right now. Please try again.",
        error.requestID ?? undefined,
      );
    }

    throw new WebsiteRefinementError(
      "invalid_model_output",
      502,
      "The refined website did not pass SiteWing validation. Please revise the instruction and try again.",
    );
  }

  if (!response.output_parsed) {
    throw new WebsiteRefinementError(
      "invalid_model_output",
      502,
      "OpenAI did not return a usable website configuration. Please revise the instruction and try again.",
    );
  }

  let config: WebsiteConfig;
  try {
    config = parseAIWebsiteConfig(response.output_parsed);
    if (!preservesPersistentMedia(currentConfig, config, prompt)) {
      throw new Error("Refinement changed protected persistent media identity.");
    }
  } catch {
    throw new WebsiteRefinementError(
      "invalid_model_output",
      502,
      "The refined website did not pass SiteWing validation. Please revise the instruction and try again.",
    );
  }

  return {
    config,
    metadata: {
      operation: "refinement",
      model: SITEWING_MODEL,
      durationMs: Math.round(performance.now() - startedAt),
      usage: {
        inputTokens: response.usage?.input_tokens ?? null,
        outputTokens: response.usage?.output_tokens ?? null,
        totalTokens: response.usage?.total_tokens ?? null,
      },
    },
  };
}
