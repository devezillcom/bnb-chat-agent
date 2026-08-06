import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { APIError } from "@/lib/exposers/api-error";
import type {
  GetUploadSignedUrlParams,
  GetUploadSignedUrlResult,
} from "@/lib/r2/types";
import { buildUploadObjectKey } from "@/lib/r2/utils/build-upload-object-key";
import { isMimeAllowed } from "@/lib/r2/utils/is-mime-allowed";
import { normalizeContentType } from "@/lib/r2/utils/normalize-content-type";
import { getR2S3Client, isR2Configured } from "@/lib/r2/utils/get-r2-s3-client";

const DEFAULT_PRESIGNED_PUT_EXPIRES_SEC = 15 * 60;

export async function getUploadSignedUrl(
  params: GetUploadSignedUrlParams,
): Promise<GetUploadSignedUrlResult> {
  if (!isR2Configured()) {
    throw new APIError("ERR_NOT_CONFIGURED", "Upload is not configured", 503);
  }

  const contentType = normalizeContentType(params.contentType);
  const contentLength = params.contentLength;
  const expiresInSec =
    params.expiresInSec ?? DEFAULT_PRESIGNED_PUT_EXPIRES_SEC;

  if (contentLength > params.maxBytes) {
    throw new APIError("ERR_UPLOAD_SIZE", params.sizeError, 400);
  }

  if (!isMimeAllowed(contentType, params.allowedMimes)) {
    throw new APIError("ERR_UPLOAD_MIME", params.mimeError, 400);
  }

  const client = getR2S3Client();
  const bucket = process.env.R2_BUCKET_NAME;
  const publicUrlBase = process.env.R2_PUBLIC_URL;

  if (!client || !bucket || !publicUrlBase) {
    throw new APIError("ERR_NOT_CONFIGURED", "Upload is not configured", 503);
  }

  const key = buildUploadObjectKey({
    prefix: params.prefix,
    contentType,
  });

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
    ContentLength: contentLength,
  });

  const uploadUrl = await getSignedUrl(client, command, {
    expiresIn: expiresInSec,
  });

  const publicUrl = `${publicUrlBase.replace(/\/$/, "")}/${key}`;
  const expiresAt = Date.now() + expiresInSec * 1000;

  return {
    uploadUrl,
    key,
    publicUrl,
    expiresAt,
  };
}
