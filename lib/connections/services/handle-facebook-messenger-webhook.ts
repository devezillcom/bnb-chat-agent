import type { FacebookWebhookBody } from "../types";
import { handleFacebookMessagingEvent } from "./handle-facebook-messenger-message";

export async function handleFacebookMessengerWebhook(
  body: FacebookWebhookBody,
): Promise<void> {
  if (body.object !== "page") {
    return;
  }

  for (const entry of body.entry) {
    for (const event of entry.messaging) {
      if (event.message?.is_echo) {
        continue;
      }

      await handleFacebookMessagingEvent(event);
    }
  }
}
