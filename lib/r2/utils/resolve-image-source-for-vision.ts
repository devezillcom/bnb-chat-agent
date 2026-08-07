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
  const response = await fetch(url, { cache: "no-store" });
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

function unwrapR2ResizeUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const resizePrefix = "/cdn-cgi/image/";

    if (!parsed.pathname.includes(resizePrefix)) {
      return null;
    }

    const index = parsed.pathname.indexOf(resizePrefix);
    const remainder = parsed.pathname.slice(index + resizePrefix.length);
    const slashIndex = remainder.indexOf("/");

    if (slashIndex === -1) {
      return null;
    }

    parsed.pathname = `/${remainder.slice(slashIndex + 1)}`;
    return parsed.toString();
  } catch {
    return null;
  }
}

function extractObjectKeyFromPublicUrl(url: string): string | null {
  const publicUrlBase =
    process.env.R2_PUBLIC_URL ?? process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
  if (!publicUrlBase) return null;

  const normalizedBase = publicUrlBase.replace(/\/$/, "");
  const directUrl = unwrapR2ResizeUrl(url) ?? url;

  if (!directUrl.startsWith(`${normalizedBase}/`)) return null;

  return directUrl.slice(normalizedBase.length + 1);
}

async function fetchImageBufferForVision(url: string): Promise<{
  body: Buffer;
  contentType: string | undefined;
}> {
  try {
    return await fetchImageBufferFromUrl(url);
  } catch (error) {
    const originalUrl = unwrapR2ResizeUrl(url);
    if (!originalUrl) {
      throw error;
    }

    return fetchImageBufferFromUrl(originalUrl);
  }
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
          const fetched = await fetchImageBufferForVision(params.url);
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

  const fetched = await fetchImageBufferForVision(params.url);
  const mimeType =
    params.mimeType ?? fetched.contentType ?? "application/octet-stream";
  return toVisionDataUrl(fetched.body, mimeType);
}
