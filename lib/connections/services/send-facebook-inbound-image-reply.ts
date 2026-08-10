import { sendFacebookMessengerImageMessage } from "../utils/send-facebook-messenger-message";

export async function sendFacebookInboundImageReply(params: {
  pageAccessToken: string;
  psid: string;
  imageUrl: string;
}): Promise<void> {
  await sendFacebookMessengerImageMessage({
    pageAccessToken: params.pageAccessToken,
    psid: params.psid,
    imageUrl: params.imageUrl,
  });
}
