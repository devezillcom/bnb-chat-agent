import { getAdminAuth } from "@/lib/firebase/admin";
import {
  readFirebaseDatabaseUrl,
  websiteEmbedAssistantMessageStreamUrl,
} from "@/lib/chat-agent/utils/website-embed-rtdb";
import { APIError } from "@/lib/exposers/api-error";

import type { EmbedRtdbStreamAuth } from "../types";

const IDENTITY_TOOLKIT_URL =
  "https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken";

type CustomTokenExchange = {
  idToken?: string;
  expiresIn?: string;
};

function readFirebaseApiKey() {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim();
  return apiKey || null;
}

export async function createEmbedRtdbStreamAuth(params: {
  connectionId: string;
  visitorId: string;
}): Promise<EmbedRtdbStreamAuth | null> {
  const databaseUrl = readFirebaseDatabaseUrl();
  const apiKey = readFirebaseApiKey();
  const auth = getAdminAuth();

  if (!databaseUrl || !apiKey || !auth) {
    return null;
  }

  let customToken: string;
  try {
    customToken = await auth.createCustomToken(params.visitorId, {
      connectionId: params.connectionId,
      visitorId: params.visitorId,
    });
  } catch (error) {
    console.error(error);
    throw new APIError(
      "ERR_EMBED_RTDB_UNAVAILABLE",
      "Chat sync is unavailable.",
      503,
    );
  }

  const response = await fetch(
    `${IDENTITY_TOOLKIT_URL}?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: customToken, returnSecureToken: true }),
    },
  );

  if (!response.ok) {
    console.error("Embed RTDB token exchange failed", response.status);
    throw new APIError(
      "ERR_EMBED_RTDB_UNAVAILABLE",
      "Chat sync is unavailable.",
      503,
    );
  }

  const body = (await response.json()) as CustomTokenExchange;
  if (!body.idToken) {
    throw new APIError(
      "ERR_EMBED_RTDB_UNAVAILABLE",
      "Chat sync is unavailable.",
      503,
    );
  }

  const expiresInSeconds = Number(body.expiresIn);
  const ttlSeconds =
    Number.isFinite(expiresInSeconds) && expiresInSeconds > 0
      ? expiresInSeconds
      : 60 * 60;

  return {
    streamUrl: websiteEmbedAssistantMessageStreamUrl({
      databaseUrl,
      connectionId: params.connectionId,
      visitorId: params.visitorId,
    }),
    authToken: body.idToken,
    expiresAt: new Date(Date.now() + ttlSeconds * 1000).toISOString(),
  };
}
