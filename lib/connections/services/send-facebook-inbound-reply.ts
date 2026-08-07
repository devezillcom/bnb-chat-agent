import { sendFacebookMessengerTextMessage } from "../utils/send-facebook-messenger-message";

export async function sendFacebookInboundReply(params: {
  pageAccessToken: string;
  psid: string;
  text: string;
}): Promise<void> {
  await sendFacebookMessengerTextMessage({
    pageAccessToken: params.pageAccessToken,
    psid: params.psid,
    text: params.text,
  });
}
