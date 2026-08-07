import { createHmac, timingSafeEqual } from "crypto";

import { getFacebookAppSecret } from "./get-facebook-config";

export function verifyFacebookWebhookSignature(params: {
  rawBody: string;
  signatureHeader: string | null;
}): boolean {
  if (!params.signatureHeader?.startsWith("sha256=")) {
    return false;
  }

  const expected = createHmac("sha256", getFacebookAppSecret())
    .update(params.rawBody, "utf8")
    .digest("hex");
  const received = params.signatureHeader.slice("sha256=".length);

  try {
    return timingSafeEqual(
      Buffer.from(expected, "hex"),
      Buffer.from(received, "hex"),
    );
  } catch {
    return false;
  }
}
