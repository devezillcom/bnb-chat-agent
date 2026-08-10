import { sql } from "drizzle-orm";

import { chatAgentSessions } from "@/db/schema";
import { db } from "@/lib/db";

import { buildChatAgentSessionTitle } from "../utils/build-chat-agent-session-title";

export type UpsertChatAgentSessionParams = {
  sessionId: string;
  workspaceId: string;
  userId: string;
  agentId: string;
  message: string;
};

export async function upsertChatAgentSession(
  params: UpsertChatAgentSessionParams,
): Promise<void> {
  const title = buildChatAgentSessionTitle(params.message);
  const now = new Date();

  await db
    .insert(chatAgentSessions)
    .values({
      id: params.sessionId,
      workspaceId: params.workspaceId,
      userId: params.userId,
      agentId: params.agentId,
      title,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: chatAgentSessions.id,
      set: {
        updatedAt: now,
      },
      where: sql`${chatAgentSessions.workspaceId} = ${params.workspaceId} AND ${chatAgentSessions.userId} = ${params.userId} AND ${chatAgentSessions.agentId} = ${params.agentId}`,
    });
}
