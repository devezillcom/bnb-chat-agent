import { createDecipheriv } from "crypto";

import { APIError } from "@/lib/exposers/api-error";

import {
  AUTH_TAG_LENGTH,
  IV_LENGTH,
} from "./encrypt-secret-content";
import { getEncryptionKey } from "./get-encryption-key";

const ALGORITHM = "aes-256-gcm";

export function decryptSecretContent(encoded: string): string {
  const key = getEncryptionKey();
  const data = Buffer.from(encoded, "base64");

  if (data.length <= IV_LENGTH + AUTH_TAG_LENGTH) {
    throw new APIError(
      "ERR_SECRET_DECRYPT",
      "Stored secret content is invalid.",
      500,
    );
  }

  const iv = data.subarray(0, IV_LENGTH);
  const authTag = data.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = data.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  try {
    return Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    throw new APIError(
      "ERR_SECRET_DECRYPT",
      "Unable to decrypt secret content.",
      500,
    );
  }
}
