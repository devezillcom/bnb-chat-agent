import { DeleteObjectsCommand } from "@aws-sdk/client-s3";

import { APIError } from "@/lib/exposers/api-error";
import { getR2S3Client, isR2Configured } from "@/lib/r2/utils/get-r2-s3-client";

export type DeleteObjectsFromR2Params = {
  keys: string[];
};

export type DeleteObjectsFromR2Result = {
  deletedKeys: string[];
};

function normalizeObjectKey(key: string): string | null {
  const objectKey = key.trim().replace(/^\//, "");
  if (!objectKey || objectKey.includes("..")) {
    return null;
  }

  return objectKey;
}

export async function deleteObjectsFromR2(
  params: DeleteObjectsFromR2Params,
): Promise<DeleteObjectsFromR2Result> {
  if (!isR2Configured()) {
    return { deletedKeys: [] };
  }

  const uniqueKeys = [
    ...new Set(
      params.keys
        .map(normalizeObjectKey)
        .filter((key): key is string => key !== null),
    ),
  ];

  if (uniqueKeys.length === 0) {
    return { deletedKeys: [] };
  }

  const client = getR2S3Client();
  const bucket = process.env.R2_BUCKET_NAME;

  if (!client || !bucket) {
    throw new APIError("ERR_NOT_CONFIGURED", "R2 is not configured", 503);
  }

  await client.send(
    new DeleteObjectsCommand({
      Bucket: bucket,
      Delete: {
        Objects: uniqueKeys.map((Key) => ({ Key })),
        Quiet: true,
      },
    }),
  );

  return { deletedKeys: uniqueKeys };
}
