import { FACEBOOK_MESSENGER_TYPING_HEARTBEAT_INTERVAL_MS } from "../constants";
import { sendFacebookMessengerSenderAction } from "./send-facebook-messenger-message";

export type WithFacebookTypingHeartbeatParams = {
  pageAccessToken: string;
  psid: string;
};

export async function withFacebookTypingHeartbeat<T>(
  params: WithFacebookTypingHeartbeatParams,
  work: () => Promise<T>,
): Promise<T> {
  const sendTypingOn = () =>
    sendFacebookMessengerSenderAction({
      pageAccessToken: params.pageAccessToken,
      psid: params.psid,
      action: "typing_on",
    });

  await sendTypingOn();

  const intervalId = setInterval(() => {
    void sendTypingOn().catch((error) => {
      console.warn("[facebook-messenger] typing heartbeat failed", {
        psid: params.psid,
        error,
      });
    });
  }, FACEBOOK_MESSENGER_TYPING_HEARTBEAT_INTERVAL_MS);

  try {
    return await work();
  } finally {
    clearInterval(intervalId);
  }
}
