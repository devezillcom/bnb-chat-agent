import { randomUUID } from "crypto";

import { and, eq } from "drizzle-orm";

import { chatAgentSessions } from "@/db/schema";
import { db } from "@/lib/db";

import type { ActiveChatEnv } from "../config/chat-env";
import { buildChatAgentSessionTitle } from "../utils/build-chat-agent-session-title";

export type UpsertInAppAgentSessionParams = {
  sessionId: string;
  workspaceId: string;
  userId: string;
  agentId: string;
  chatEnv: ActiveChatEnv;
  message: string;
};

export async function upsertInAppAgentSession(
  params: UpsertInAppAgentSessionParams,
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
      chatEnv: params.chatEnv,
      title,
      lastMessageAt: now,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: chatAgentSessions.id,
      set: {
        lastMessageAt: now,
        updatedAt: now,
      },
      where: and(
        eq(chatAgentSessions.workspaceId, params.workspaceId),
        eq(chatAgentSessions.userId, params.userId),
        eq(chatAgentSessions.agentId, params.agentId),
        eq(chatAgentSessions.chatEnv, params.chatEnv),
      ),
    });
}

export type GetOrCreateChannelAgentSessionParams = {
  connectionId: string;
  workspaceId: string;
  agentId: string;
  chatEnv: ActiveChatEnv;
  externalParticipantId: string;
  title: string;
};

export type GetOrCreateChannelAgentSessionResult = {
  sessionId: string;
  created: boolean;
};

export async function getOrCreateChannelAgentSession(
  params: GetOrCreateChannelAgentSessionParams,
): Promise<GetOrCreateChannelAgentSessionResult> {
  const [existing] = await db
    .select({
      id: chatAgentSessions.id,
      agentId: chatAgentSessions.agentId,
    })
    .from(chatAgentSessions)
    .where(
      and(
        eq(chatAgentSessions.connectionId, params.connectionId),
        eq(chatAgentSessions.externalParticipantId, params.externalParticipantId),
        eq(chatAgentSessions.chatEnv, params.chatEnv),
      ),
    )
    .limit(1);

  const now = new Date();

  if (existing) {
    if (existing.agentId !== params.agentId) {
      await db
        .delete(chatAgentSessions)
        .where(eq(chatAgentSessions.id, existing.id));

      const sessionId = randomUUID();
      await db.insert(chatAgentSessions).values({
        id: sessionId,
        workspaceId: params.workspaceId,
        connectionId: params.connectionId,
        agentId: params.agentId,
        chatEnv: params.chatEnv,
        externalParticipantId: params.externalParticipantId,
        title: params.title,
        lastMessageAt: now,
        createdAt: now,
        updatedAt: now,
      });

      return { sessionId, created: true };
    }

    await db
      .update(chatAgentSessions)
      .set({
        lastMessageAt: now,
        updatedAt: now,
      })
      .where(eq(chatAgentSessions.id, existing.id));

    return { sessionId: existing.id, created: false };
  }

  const sessionId = randomUUID();
  await db.insert(chatAgentSessions).values({
    id: sessionId,
    workspaceId: params.workspaceId,
    connectionId: params.connectionId,
    agentId: params.agentId,
    chatEnv: params.chatEnv,
    externalParticipantId: params.externalParticipantId,
    title: params.title,
    lastMessageAt: now,
    createdAt: now,
    updatedAt: now,
  });

  return { sessionId, created: true };
}

/** @deprecated Use upsertInAppAgentSession */
export const upsertChatAgentSession = upsertInAppAgentSession;
