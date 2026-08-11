import { FACEBOOK_MESSENGER_SEND_API_URL } from "../constants";

type FacebookSenderAction = "typing_on" | "typing_off" | "mark_seen";

type SendFacebookMessengerMessageParams = {
  pageAccessToken: string;
  psid: string;
  requestBody: Record<string, unknown>;
};

async function callFacebookMessengerSendApi(
  params: SendFacebookMessengerMessageParams,
): Promise<void> {
  const url = new URL(FACEBOOK_MESSENGER_SEND_API_URL);
  url.searchParams.set("access_token", params.pageAccessToken);

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params.requestBody),
    cache: "no-store",
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as {
      error?: { message?: string };
    } | null;
    const message = data?.error?.message ?? response.statusText;
    console.error("Facebook Send API error:", message, {
      psid: params.psid,
      requestBody: params.requestBody,
    });
    throw new Error(`Facebook Send API failed (${response.status}): ${message}`);
  }
}

export async function sendFacebookMessengerImageMessage(params: {
  pageAccessToken: string;
  psid: string;
  imageUrl: string;
}): Promise<void> {
  console.log("[facebook-messenger] send image", {
    psid: params.psid,
    imageUrl: params.imageUrl,
  });

  await callFacebookMessengerSendApi({
    pageAccessToken: params.pageAccessToken,
    psid: params.psid,
    requestBody: {
      recipient: { id: params.psid },
      messaging_type: "RESPONSE",
      message: {
        attachment: {
          type: "image",
          payload: {
            url: params.imageUrl,
            is_reusable: true,
          },
        },
      },
    },
  });

  console.log("[facebook-messenger] send image ok", {
    psid: params.psid,
    imageUrl: params.imageUrl,
  });
}

export async function sendFacebookMessengerTextMessage(params: {
  pageAccessToken: string;
  psid: string;
  text: string;
}): Promise<void> {
  console.log("[facebook-messenger] send message", {
    psid: params.psid,
    textLength: params.text.length,
    textPreview: params.text.slice(0, 120),
  });

  await callFacebookMessengerSendApi({
    pageAccessToken: params.pageAccessToken,
    psid: params.psid,
    requestBody: {
      recipient: { id: params.psid },
      messaging_type: "RESPONSE",
      message: { text: params.text },
    },
  });

  console.log("[facebook-messenger] send message ok", {
    psid: params.psid,
    textLength: params.text.length,
  });
}

export async function sendFacebookMessengerSenderAction(params: {
  pageAccessToken: string;
  psid: string;
  action: FacebookSenderAction;
}): Promise<void> {
  await callFacebookMessengerSendApi({
    pageAccessToken: params.pageAccessToken,
    psid: params.psid,
    requestBody: {
      recipient: { id: params.psid },
      sender_action: params.action,
    },
  });
}
