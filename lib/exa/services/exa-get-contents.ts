import { z } from "zod";

import { APIError } from "@/lib/exposers/api-error";

import {
  exaDefaultImageLinks,
  type ExaGetContentsParams,
  type ExaGetContentsResult,
} from "../types";

const exaContentsEndpoint = "https://api.exa.ai/contents";

const exaContentsExtrasSchema = z
  .object({
    links: z.array(z.string()).optional(),
    imageLinks: z.array(z.string()).optional(),
  })
  .optional();

const exaContentsResultSchema = z.object({
  id: z.string().optional(),
  url: z.string().optional(),
  title: z.string().optional(),
  author: z.union([z.string(), z.null()]).optional(),
  publishedDate: z.union([z.string(), z.null()]).optional(),
  text: z.string().optional(),
  image: z.string().optional(),
  favicon: z.string().optional(),
  extras: exaContentsExtrasSchema,
});

const exaContentsStatusSchema = z.object({
  id: z.string().optional(),
  status: z.string().optional(),
  error: z
    .object({
      tag: z.string().optional(),
      httpStatusCode: z.number().optional(),
    })
    .optional(),
});

const exaContentsResponseSchema = z.object({
  results: z.array(exaContentsResultSchema).optional(),
  statuses: z.array(exaContentsStatusSchema).optional(),
});

export async function exaGetContents(
  params: ExaGetContentsParams,
): Promise<ExaGetContentsResult> {
  const apiKey = process.env.EXA_API_KEY;

  if (!apiKey) {
    throw new APIError(
      "ERR_EXA_NOT_CONFIGURED",
      "Exa is not configured. Set EXA_API_KEY.",
      500,
    );
  }

  const url = params.url.trim();
  if (!url) {
    throw new APIError(
      "ERR_EXA_URL_REQUIRED",
      "A non-empty URL is required.",
      400,
    );
  }

  const maxCharacters = params.maxCharacters ?? 12000;

  const response = await fetch(exaContentsEndpoint, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      urls: [url],
      text: { maxCharacters },
      extras: {
        imageLinks: exaDefaultImageLinks,
      },
    }),
  });

  const responseText = await response.text();
  let json: unknown;

  try {
    json = JSON.parse(responseText);
  } catch {
    throw new APIError(
      "ERR_EXA_INVALID_RESPONSE",
      `Exa returned non-JSON response (${response.status} ${response.statusText}).`,
      502,
    );
  }

  if (!response.ok) {
    const message =
      typeof json === "object" &&
      json !== null &&
      "error" in json &&
      typeof (json as { error?: unknown }).error === "string"
        ? (json as { error: string }).error
        : responseText.slice(0, 500);

    throw new APIError(
      "ERR_EXA_REQUEST_FAILED",
      `Exa contents request failed: ${response.status} ${message}`,
      response.status >= 500 ? 502 : 400,
    );
  }

  const parsed = exaContentsResponseSchema.safeParse(json);
  if (!parsed.success) {
    throw new APIError(
      "ERR_EXA_INVALID_RESPONSE",
      "Exa returned an unexpected contents payload.",
      502,
    );
  }

  const failedStatus = parsed.data.statuses?.find(
    (status) => status.status === "error",
  );
  if (failedStatus) {
    const tag = failedStatus.error?.tag ?? "unknown";
    return {
      item: null,
      error: `Exa could not fetch content for this URL (${tag}).`,
    };
  }

  const result = parsed.data.results?.[0];
  if (!result) {
    return {
      item: null,
      error: "Exa returned no content for this URL.",
    };
  }

  const text = result.text?.trim();
  if (!text) {
    return {
      item: null,
      error: "Exa returned an empty page for this URL.",
    };
  }

  return {
    item: {
      url: result.url?.trim() || url,
      title: result.title?.trim(),
      text,
      author: result.author ?? null,
      publishedDate: result.publishedDate ?? null,
      image: result.image?.trim(),
      favicon: result.favicon?.trim(),
      imageLinks: result.extras?.imageLinks?.filter(Boolean),
    },
  };
}
