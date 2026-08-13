import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { APIError } from "@/lib/exposers/api-error";
import type {
  GetDownloadSignedUrlParams,
  GetDownloadSignedUrlResult,
} from "@/lib/r2/types";
import { getR2S3Client, isR2Configured } from "@/lib/r2/utils/get-r2-s3-client";

const DEFAULT_PRESIGNED_GET_EXPIRES_SEC = 15 * 60;

export async function getDownloadSignedUrl(
  params: GetDownloadSignedUrlParams,
): Promise<GetDownloadSignedUrlResult> {
  if (!isR2Configured()) {
    throw new APIError("ERR_NOT_CONFIGURED", "Download is not configured", 503);
  }

  const objectKey = params.key.trim().replace(/^\//, "");
  if (!objectKey || objectKey.includes("..")) {
    throw new APIError(
      "ERR_R2_INVALID_KEY",
      `Invalid R2 object key: "${params.key}"`,
      400,
    );
  }

  const client = getR2S3Client();
  const bucket = process.env.R2_BUCKET_NAME;
  if (!client || !bucket) {
    throw new APIError("ERR_NOT_CONFIGURED", "Download is not configured", 503);
  }

  const expiresInSec =
    params.expiresInSec ?? DEFAULT_PRESIGNED_GET_EXPIRES_SEC;

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: objectKey,
    ...(params.contentType
      ? { ResponseContentType: params.contentType }
      : {}),
    ...(params.filename
      ? {
          ResponseContentDisposition: `inline; filename="${encodeURIComponent(params.filename)}"`,
        }
      : {}),
  });

  const downloadUrl = await getSignedUrl(client, command, {
    expiresIn: expiresInSec,
  });

  return {
    downloadUrl,
    expiresAt: Date.now() + expiresInSec * 1000,
  };
}
