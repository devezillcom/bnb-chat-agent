import { getExtensionFromMime } from "@/lib/r2/utils/get-extension-from-mime";

export type BuildUploadObjectKeyParams = {
  prefix?: string;
  contentType: string;
};

export function buildUploadObjectKey({
  prefix,
  contentType,
}: BuildUploadObjectKeyParams): string {
  const id = crypto.randomUUID();
  const ext = getExtensionFromMime(contentType);
  const normalized = (prefix ?? "")
    .trim()
    .split("/")
    .filter((segment) => segment.length > 0)
    .join("/");

  return normalized === "" ? `${id}.${ext}` : `${normalized}/${id}.${ext}`;
}
