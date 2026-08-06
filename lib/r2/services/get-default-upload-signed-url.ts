import { z } from "zod";

import { getSession } from "@/lib/auth";
import { APIError } from "@/lib/exposers/api-error";
import { DEFAULT_UPLOAD_SIGNED_URL_RULES } from "@/lib/r2/constants";
import { getUploadSignedUrl } from "@/lib/r2/services/get-upload-signed-url";
import type { GetUploadSignedUrlResult } from "@/lib/r2/types";

const getDefaultUploadSignedUrlInputSchema = z.object({
  contentType: z.string(),
  contentLength: z.number().int().positive(),
});

export async function getDefaultUploadSignedUrl(
  raw: unknown,
): Promise<GetUploadSignedUrlResult> {
  const session = await getSession();
  if (!session) {
    throw new APIError("Unauthorized", "Unauthorized", 401);
  }

  const parsed = getDefaultUploadSignedUrlInputSchema.safeParse(raw);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => i.message).join("; ");
    throw new APIError("ERR_INVALID_INPUT", msg || "Invalid input", 400);
  }

  return getUploadSignedUrl({
    contentType: parsed.data.contentType,
    contentLength: parsed.data.contentLength,
    maxBytes: DEFAULT_UPLOAD_SIGNED_URL_RULES.maxBytes,
    allowedMimes: DEFAULT_UPLOAD_SIGNED_URL_RULES.allowedMimes,
    mimeError: DEFAULT_UPLOAD_SIGNED_URL_RULES.mimeError,
    sizeError: DEFAULT_UPLOAD_SIGNED_URL_RULES.sizeError,
    prefix: session.id,
  });
}
