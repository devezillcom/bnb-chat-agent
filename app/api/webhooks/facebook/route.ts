import { after } from "next/server";
import { NextRequest } from "next/server";

import { handleFacebookMessengerWebhook } from "@/lib/connections/services/handle-facebook-messenger-webhook";
import type { FacebookWebhookBody } from "@/lib/connections/types";
import { getFacebookWebhookVerifyToken } from "@/lib/connections/utils/get-facebook-config";
import { verifyFacebookWebhookSignature } from "@/lib/connections/utils/verify-facebook-webhook-signature";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  try {
    const verifyToken = getFacebookWebhookVerifyToken();

    if (mode === "subscribe" && token === verifyToken && challenge) {
      return new Response(challenge, { status: 200 });
    }
  } catch (error) {
    console.error("[facebook-webhook] Verification failed:", error);
  }

  return new Response(null, { status: 403 });
}

export async function POST(request: Request) {
  const rawBody = await request.text();

  if (
    !verifyFacebookWebhookSignature({
      rawBody,
      signatureHeader: request.headers.get("x-hub-signature-256"),
    })
  ) {
    return new Response(null, { status: 403 });
  }

  let body: FacebookWebhookBody;

  try {
    body = JSON.parse(rawBody) as FacebookWebhookBody;
  } catch {
    return new Response(null, { status: 400 });
  }

  if (body.object !== "page") {
    return new Response(null, { status: 404 });
  }

  after(async () => {
    try {
      await handleFacebookMessengerWebhook(body);
    } catch (error) {
      console.error("[facebook-webhook] Event handling failed:", error);
    }
  });

  return new Response("EVENT_RECEIVED", { status: 200 });
}
