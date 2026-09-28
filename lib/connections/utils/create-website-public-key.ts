import { randomBytes } from "node:crypto";

export function createWebsitePublicKey() {
  return randomBytes(24).toString("base64url");
}
