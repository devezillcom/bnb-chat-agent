import { FACEBOOK_MESSENGER_SEND_API_URL } from "../constants";

type FacebookSenderAction = "typing_on" | "typing_off" | "mark_seen";

type SendFacebookMessengerMessageParams = {
  pageAccessToken: string;
  psid: string;
  requestBody: Record<string, unknown>;
};

async function callFacebookMessengerSendApi(
  params: SendFacebookMessengerMessageParams,
): Promise<number> {
  const url = new URL(FACEBOOK_MESSENGER_SEND_API_URL);
  url.searchParams.set("access_token", params.pageAccessToken);
  const startedAt = Date.now();

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params.requestBody),
      cache: "no-store",
    });

    const durationMs = Date.now() - startedAt;

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as {
        error?: { message?: string };
      } | null;
      const message = data?.error?.message ?? response.statusText;
      console.error("Facebook Send API error:", message, {
        psid: params.psid,
        durationMs,
        requestBody: params.requestBody,
      });
      throw new Error(`Facebook Send API failed (${response.status}): ${message}`);
    }

    return durationMs;
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Facebook Send API failed")) {
      throw error;
    }

    console.error("Facebook Send API error:", error, {
      psid: params.psid,
      durationMs: Date.now() - startedAt,
      requestBody: params.requestBody,
    });
    throw error;
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

  const durationMs = await callFacebookMessengerSendApi({
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
    durationMs,
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

  const durationMs = await callFacebookMessengerSendApi({
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
    durationMs,
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
