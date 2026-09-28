const WEBSITE_EMBED_ASSISTANT_MESSAGE_ROOT = "embed-messages";

export type WebsiteEmbedAssistantMessageRecord = {
  sessionId: string;
  message: string;
  updatedAt: number;
};

export function websiteEmbedAssistantMessagePath(
  connectionId: string,
  visitorId: string,
) {
  return `${WEBSITE_EMBED_ASSISTANT_MESSAGE_ROOT}/${connectionId}/${visitorId}`;
}

export function readFirebaseDatabaseUrl() {
  const url = (
    process.env.FIREBASE_DATABASE_URL ||
    process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ||
    ""
  ).trim();

  return url ? url.replace(/\/+$/, "") : null;
}

export function websiteEmbedAssistantMessageStreamUrl(params: {
  databaseUrl: string;
  connectionId: string;
  visitorId: string;
}) {
  const base = params.databaseUrl.replace(/\/+$/, "");
  const path = websiteEmbedAssistantMessagePath(
    params.connectionId,
    params.visitorId,
  );

  return `${base}/${path}.json`;
}
