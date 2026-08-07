import { decryptSecretContent } from "@/lib/secret-data-store/utils/decrypt-secret-content";
import { encryptSecretContent } from "@/lib/secret-data-store/utils/encrypt-secret-content";

export function encryptConnectionAuthData<T extends Record<string, unknown>>(
  data: T,
): string {
  return encryptSecretContent(JSON.stringify(data));
}

export function decryptConnectionAuthData<T extends Record<string, unknown>>(
  encrypted: string,
): T {
  return JSON.parse(decryptSecretContent(encrypted)) as T;
}
