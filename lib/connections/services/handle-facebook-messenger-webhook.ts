import type { FacebookWebhookBody } from "../types";
import { handleFacebookMessengerMessage } from "./handle-facebook-messenger-message";
import { handleFacebookMessengerPostback } from "./handle-facebook-messenger-message";

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

      if (event.message) {
        await handleFacebookMessengerMessage({
          pageId: event.recipient.id,
          psid: event.sender.id,
          message: event.message,
        });
        continue;
      }

      if (event.postback) {
        await handleFacebookMessengerPostback({
          pageId: event.recipient.id,
          psid: event.sender.id,
          postback: event.postback,
        });
      }
    }
  }
}
