import type {
  FacebookConnectionAuthData,
  FacebookIncomingMessage,
} from "../types";
import { decryptConnectionAuthData } from "../utils/encrypt-connection-auth-data";
import { resolveFacebookConnectionPage } from "../utils/resolve-facebook-connection-page";
import {
  sendFacebookMessengerSenderAction,
  sendFacebookMessengerTextMessage,
} from "../utils/send-facebook-messenger-message";
import { getFacebookConnectionByPageId } from "./get-facebook-connection-by-page-id";

export async function handleFacebookMessengerMessage(params: {
  pageId: string;
  psid: string;
  message: FacebookIncomingMessage;
}): Promise<void> {
  const connection = await getFacebookConnectionByPageId(params.pageId);

  if (!connection) {
    console.warn(
      `[facebook-webhook] No connection found for page ${params.pageId}`,
    );
    return;
  }

  const auth = decryptConnectionAuthData<FacebookConnectionAuthData>(
    connection.encryptedAuthData,
  );
  const { auth: resolvedAuth } = await resolveFacebookConnectionPage({
    pageId: params.pageId,
    auth,
  });
  const pageAccessToken = resolvedAuth.access_token;

  await sendFacebookMessengerSenderAction({
    pageAccessToken,
    psid: params.psid,
    action: "mark_seen",
  });
  await sendFacebookMessengerSenderAction({
    pageAccessToken,
    psid: params.psid,
    action: "typing_on",
  });

  let replyText: string | null = null;

  if (params.message.text) {
    replyText = `Connection test OK — you said: "${params.message.text}"`;
  } else if (params.message.attachments?.length) {
    replyText = "Connection test OK — thanks for the attachment!";
  }

  if (replyText) {
    await sendFacebookMessengerTextMessage({
      pageAccessToken,
      psid: params.psid,
      text: replyText,
    });
  }

  await sendFacebookMessengerSenderAction({
    pageAccessToken,
    psid: params.psid,
    action: "typing_off",
  });
}
