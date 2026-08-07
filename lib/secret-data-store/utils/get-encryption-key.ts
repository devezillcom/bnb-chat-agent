import { APIError } from "@/lib/exposers/api-error";

export function getEncryptionKey(): Buffer {
  const raw = process.env.SECRET_DATA_ENCRYPTION_KEY;

  if (!raw?.trim()) {
    throw new APIError(
      "ERR_SECRET_ENCRYPTION_KEY",
      "Secret data encryption is not configured.",
      500,
    );
  }

  const key = Buffer.from(raw.trim(), "base64");

  if (key.length !== 32) {
    throw new APIError(
      "ERR_SECRET_ENCRYPTION_KEY",
      "Secret data encryption key must be a 32-byte base64 value.",
      500,
    );
  }

  return key;
}
