import { putObjectToR2 } from "@/lib/r2/services/put-object-to-r2";
import { buildUploadObjectKey } from "@/lib/r2/utils/build-upload-object-key";
import { isR2Configured } from "@/lib/r2/utils/get-r2-s3-client";
import { isR2HostedUrl } from "@/lib/r2/utils/is-r2-hosted-url";
import { normalizeContentType } from "@/lib/r2/utils/normalize-content-type";

import { BIENHINH_RESULT_IMAGE_R2_PREFIX } from "../constants";

function toAbsoluteR2PublicUrl(url: string): string {
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  const publicUrlBase = process.env.R2_PUBLIC_URL?.trim().replace(/\/$/, "");
  if (!publicUrlBase) {
    throw new Error("R2_PUBLIC_URL is not configured.");
  }

  return `${publicUrlBase}/${trimmed.replace(/^\//, "")}`;
}

async function downloadImage(url: string): Promise<{
  body: Buffer;
  contentType: string;
}> {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(
      `Could not download Bienhinh result image (${response.status}).`,
    );
  }

  return {
    body: Buffer.from(await response.arrayBuffer()),
    contentType: normalizeContentType(
      response.headers.get("content-type") ?? "application/octet-stream",
    ),
  };
}

/**
 * Re-host Bienhinh result images on R2 before they are returned to callers
 * (agent delivery, Facebook send, etc.).
 */
export async function storeBienhinhResultImageOnR2(
  imageUrl: string,
): Promise<string> {
  const trimmed = imageUrl.trim();
  if (!trimmed) {
    throw new Error("Image URL is required.");
  }

  if (isR2HostedUrl(trimmed)) {
    return toAbsoluteR2PublicUrl(trimmed);
  }

  if (!isR2Configured()) {
    console.warn(
      "[store-bienhinh-result-image-on-r2] R2 is not configured; keeping original URL",
      { imageUrl: trimmed },
    );
    return trimmed;
  }

  const downloaded = await downloadImage(trimmed);
  const key = buildUploadObjectKey({
    prefix: BIENHINH_RESULT_IMAGE_R2_PREFIX,
    contentType: downloaded.contentType,
  });

  const stored = await putObjectToR2({
    key,
    body: downloaded.body,
    contentType: downloaded.contentType,
  });

  console.log("[store-bienhinh-result-image-on-r2] uploaded", {
    originalImageUrl: trimmed,
    imageUrl: stored.publicUrl,
    key: stored.key,
  });

  return stored.publicUrl;
}
