import "server-only";

import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";

import { SITEWING_GENERATION_INSTRUCTIONS } from "@/lib/ai/sitewing-generation-instructions";
import {
  aiWebsiteConfigSchema,
  parseAIWebsiteConfig,
} from "@/lib/ai/website-config-schema";
import { collectStorageMediaPaths } from "@/lib/media/storage-media";
import type { WebsiteConfig } from "@/types/website";

const SITEWING_MODEL = "gpt-5.4-mini";
const MAX_DIAGNOSTIC_MESSAGE_LENGTH = 600;
const WEBSITE_CONFIG_TEXT_FORMAT = zodTextFormat(
  aiWebsiteConfigSchema,
  "website_config",
  {
    description:
      "A complete SiteWing WebsiteConfig using only supported sections.",
  },
);

export type WebsiteGenerationErrorCode =
  | "missing_api_key"
  | "rate_limited"
  | "openai_authentication"
  | "openai_unavailable"
  | "invalid_model_output";

export class WebsiteGenerationError extends Error {
  constructor(
    readonly code: WebsiteGenerationErrorCode,
    readonly status: number,
    readonly safeMessage: string,
    readonly requestId?: string,
  ) {
    super(safeMessage);
    this.name = "WebsiteGenerationError";
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

function logOpenAIGenerationError(error: unknown): void {
  const apiError = error instanceof OpenAI.APIError ? error : undefined;
  const errorName = error instanceof Error ? error.name : typeof error;
  const rawMessage =
    error instanceof Error ? error.message : "Unknown OpenAI generation error";

  console.error("[sitewing:openai-error]", {
    errorName,
    httpStatus: apiError?.status ?? null,
    openaiCode: apiError?.code ?? null,
    errorType: apiError?.type ?? null,
    message: sanitizeDiagnosticMessage(rawMessage),
    requestId: apiError?.requestID ?? null,
  });
}

export async function generateWebsiteConfig(
  prompt: string,
): Promise<WebsiteConfig> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new WebsiteGenerationError(
      "missing_api_key",
      503,
      "Website generation is not configured yet. Add OPENAI_API_KEY to the server environment.",
    );
  }

  const openai = new OpenAI({ apiKey });
  let response: Awaited<ReturnType<typeof openai.responses.parse>>;

  try {
    response = await openai.responses.parse({
      model: SITEWING_MODEL,
      instructions: SITEWING_GENERATION_INSTRUCTIONS,
      input: prompt,
      store: false,
      max_output_tokens: 24000,
      reasoning: { effort: "low" },
      text: {
        format: WEBSITE_CONFIG_TEXT_FORMAT,
      },
    });
  } catch (error: unknown) {
    logOpenAIGenerationError(error);

    if (error instanceof OpenAI.RateLimitError) {
      throw new WebsiteGenerationError(
        "rate_limited",
        429,
        "Website generation is temporarily busy. Please wait a moment and try again.",
        error.requestID ?? undefined,
      );
    }

    if (error instanceof OpenAI.AuthenticationError) {
      throw new WebsiteGenerationError(
        "openai_authentication",
        503,
        "Website generation could not authenticate with OpenAI. Check the server API key.",
        error.requestID ?? undefined,
      );
    }

    if (error instanceof OpenAI.APIError) {
      throw new WebsiteGenerationError(
        "openai_unavailable",
        502,
        "OpenAI could not generate the website right now. Please try again.",
        error.requestID ?? undefined,
      );
    }

    throw new WebsiteGenerationError(
      "invalid_model_output",
      502,
      "The generated website did not pass SiteWing validation. Please revise the description and try again.",
    );
  }

  if (!response.output_parsed) {
    throw new WebsiteGenerationError(
      "invalid_model_output",
      502,
      "OpenAI did not return a usable website configuration. Please revise the description and try again.",
    );
  }

  try {
    const config = parseAIWebsiteConfig(response.output_parsed);
    if (collectStorageMediaPaths(config).size > 0) throw new Error("Generated config invented persistent media.");
    return config;
  } catch {
    throw new WebsiteGenerationError(
      "invalid_model_output",
      502,
      "The generated website did not pass SiteWing validation. Please revise the description and try again.",
    );
  }
}
