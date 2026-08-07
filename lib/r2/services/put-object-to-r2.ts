import { PutObjectCommand } from "@aws-sdk/client-s3";

import { APIError } from "@/lib/exposers/api-error";
import { getR2S3Client, isR2Configured } from "@/lib/r2/utils/get-r2-s3-client";
import { normalizeContentType } from "@/lib/r2/utils/normalize-content-type";

export type PutObjectToR2Params = {
  key: string;
  body: Buffer;
  contentType: string;
};

export type PutObjectToR2Result = {
  key: string;
  publicUrl: string;
};

export async function putObjectToR2(
  params: PutObjectToR2Params,
): Promise<PutObjectToR2Result> {
  if (!isR2Configured()) {
    throw new APIError("ERR_NOT_CONFIGURED", "R2 is not configured", 503);
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
  const publicUrlBase = process.env.R2_PUBLIC_URL;

  if (!client || !bucket || !publicUrlBase) {
    throw new APIError("ERR_NOT_CONFIGURED", "R2 is not configured", 503);
  }

  const contentType = normalizeContentType(params.contentType);

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: objectKey,
      Body: params.body,
      ContentType: contentType,
    }),
  );

  const publicUrl = `${publicUrlBase.replace(/\/$/, "")}/${objectKey}`;

  return {
    key: objectKey,
    publicUrl,
  };
}
