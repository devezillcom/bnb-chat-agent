import { getAdminDatabase } from "@/lib/firebase/admin";

import { websiteEmbedAssistantMessagePath } from "../utils/website-embed-rtdb";

export async function publishWebsiteAssistantMessage(params: {
  connectionId: string;
  visitorId: string;
  sessionId: string;
  message: string;
}) {
  const adminDb = getAdminDatabase();
  if (!adminDb) {
    return;
  }

  const path = websiteEmbedAssistantMessagePath(
    params.connectionId,
    params.visitorId,
  );

  await adminDb.ref(path).set({
    sessionId: params.sessionId,
    message: params.message,
    updatedAt: Date.now(),
  });
}
