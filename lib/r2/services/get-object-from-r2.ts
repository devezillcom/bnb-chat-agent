import { GetObjectCommand } from "@aws-sdk/client-s3";

import { APIError } from "@/lib/exposers/api-error";
import { getR2S3Client } from "@/lib/r2/utils/get-r2-s3-client";

export type GetObjectFromR2Params = {
  key: string;
};

export type GetObjectFromR2Result = {
  body: Buffer;
  contentType: string | undefined;
};

export async function getObjectFromR2(
  params: GetObjectFromR2Params,
): Promise<GetObjectFromR2Result> {
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
    throw new APIError("ERR_NOT_CONFIGURED", "R2 is not configured", 503);
  }

  const response = await client.send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: objectKey,
    }),
  );

  const bytes = await response.Body?.transformToByteArray();
  if (!bytes) {
    throw new APIError("ERR_R2_EMPTY_OBJECT", "R2 object body is empty.", 404);
  }

  return {
    body: Buffer.from(bytes),
    contentType: response.ContentType,
  };
}
