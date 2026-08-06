import "server-only";

import { APIError } from "@/lib/exposers/api-error";
import { getObjectFromR2 } from "@/lib/r2/services/get-object-from-r2";

export type ResolveImageSourceForVisionParams = {
  url: string;
  key?: string;
  mimeType?: string;
};

function toVisionDataUrl(buffer: Buffer, mimeType: string): string {
  return `data:${mimeType};base64,${buffer.toString("base64")}`;
}

async function fetchImageBufferFromUrl(url: string): Promise<{
  body: Buffer;
  contentType: string | undefined;
}> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new APIError(
      "ERR_IMAGE_FETCH_FAILED",
      `Could not download image (${response.status}).`,
      400,
    );
  }

  return {
    body: Buffer.from(await response.arrayBuffer()),
    contentType: response.headers.get("content-type") ?? undefined,
  };
}

function extractObjectKeyFromPublicUrl(url: string): string | null {
  const publicUrlBase =
    process.env.R2_PUBLIC_URL ?? process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
  if (!publicUrlBase) return null;

  const normalizedBase = publicUrlBase.replace(/\/$/, "");
  if (!url.startsWith(`${normalizedBase}/`)) return null;

  return url.slice(normalizedBase.length + 1);
}

export async function resolveImageSourceForVision(
  params: ResolveImageSourceForVisionParams,
): Promise<string> {
  const objectKey =
    params.key?.trim() || extractObjectKeyFromPublicUrl(params.url);

  if (objectKey) {
    try {
      const object = await getObjectFromR2({ key: objectKey });
      const mimeType =
        params.mimeType ?? object.contentType ?? "application/octet-stream";
      return toVisionDataUrl(object.body, mimeType);
    } catch (error) {
      if (!(error instanceof APIError) || error.code !== "ERR_NOT_CONFIGURED") {
        try {
          const fetched = await fetchImageBufferFromUrl(params.url);
          const mimeType =
            params.mimeType ??
            fetched.contentType ??
            "application/octet-stream";
          return toVisionDataUrl(fetched.body, mimeType);
        } catch {
          throw error;
        }
      }
    }
  }

  const fetched = await fetchImageBufferFromUrl(params.url);
  const mimeType =
    params.mimeType ?? fetched.contentType ?? "application/octet-stream";
  return toVisionDataUrl(fetched.body, mimeType);
}
