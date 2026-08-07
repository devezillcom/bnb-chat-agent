import type { FacebookPostback } from "../types";
import { FACEBOOK_GET_STARTED_POSTBACK_PAYLOADS } from "../constants";

export function isFacebookGetStartedPostback(
  postback: FacebookPostback,
): boolean {
  const payload = postback.payload.trim();
  const normalizedPayload = payload.toUpperCase();

  if (
    FACEBOOK_GET_STARTED_POSTBACK_PAYLOADS.some(
      (value) => value === normalizedPayload,
    )
  ) {
    return true;
  }

  if (normalizedPayload.includes("GET_STARTED")) {
    return true;
  }

  return postback.title.trim().toLowerCase() === "get started";
}
