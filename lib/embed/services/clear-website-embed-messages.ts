import { and, eq } from "drizzle-orm";

import { chatAgentSessions } from "@/db/schema";
import { getChatAgentCheckpointer } from "@/lib/chat-agent/utils/get-chat-agent-checkpointer";
import { db } from "@/lib/db";

import { EMBED_CLEAR_MESSAGES_RATE_LIMIT } from "../constants";
import type {
  ClearWebsiteEmbedMessagesParams,
  ClearWebsiteEmbedMessagesResult,
} from "../types";
import { verifyEmbedToken } from "../utils/embed-token";
import { assertEmbedRateLimit } from "./assert-embed-rate-limit";
import { resolveWebsiteEmbedConnectionById } from "./resolve-website-embed-connection";

const WEBSITE_CHAT_ENV = "web" as const;

export async function clearWebsiteEmbedMessages(
  params: ClearWebsiteEmbedMessagesParams,
): Promise<ClearWebsiteEmbedMessagesResult> {
  const claims = verifyEmbedToken(params.token);
  const connection = await resolveWebsiteEmbedConnectionById(claims.connectionId);

  await assertEmbedRateLimit({
    key: `embed:messages:clear:${connection.connectionId}:${params.visitorId}`,
    limit: EMBED_CLEAR_MESSAGES_RATE_LIMIT,
  });

  const [existing] = await db
    .select({ id: chatAgentSessions.id })
    .from(chatAgentSessions)
    .where(
      and(
        eq(chatAgentSessions.connectionId, connection.connectionId),
        eq(chatAgentSessions.externalParticipantId, params.visitorId),
        eq(chatAgentSessions.chatEnv, WEBSITE_CHAT_ENV),
      ),
    )
    .limit(1);

  if (!existing) {
    return { cleared: true, sessionId: null };
  }

  const checkpointer = await getChatAgentCheckpointer();
  await checkpointer.deleteThread(existing.id);

  return { cleared: true, sessionId: existing.id };
}
