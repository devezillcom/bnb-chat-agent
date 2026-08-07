import { randomUUID } from "crypto";

import { and, eq } from "drizzle-orm";

import { connectionConversations } from "@/db/schema";
import { db } from "@/lib/db";

export type GetOrCreateConnectionConversationParams = {
  connectionId: string;
  workspaceId: string;
  agentId: string;
  externalParticipantId: string;
  title: string;
};

export type GetOrCreateConnectionConversationResult = {
  sessionId: string;
  created: boolean;
};

export async function getOrCreateConnectionConversation(
  params: GetOrCreateConnectionConversationParams,
): Promise<GetOrCreateConnectionConversationResult> {
  const [existing] = await db
    .select({
      id: connectionConversations.id,
      agentId: connectionConversations.agentId,
    })
    .from(connectionConversations)
    .where(
      and(
        eq(connectionConversations.connectionId, params.connectionId),
        eq(
          connectionConversations.externalParticipantId,
          params.externalParticipantId,
        ),
      ),
    )
    .limit(1);

  const now = new Date();

  if (existing) {
    if (existing.agentId !== params.agentId) {
      await db
        .delete(connectionConversations)
        .where(eq(connectionConversations.id, existing.id));

      const sessionId = randomUUID();
      await db.insert(connectionConversations).values({
        id: sessionId,
        workspaceId: params.workspaceId,
        connectionId: params.connectionId,
        agentId: params.agentId,
        externalParticipantId: params.externalParticipantId,
        title: params.title,
        lastMessageAt: now,
        createdAt: now,
        updatedAt: now,
      });

      return { sessionId, created: true };
    }

    await db
      .update(connectionConversations)
      .set({
        lastMessageAt: now,
        updatedAt: now,
      })
      .where(eq(connectionConversations.id, existing.id));

    return { sessionId: existing.id, created: false };
  }

  const sessionId = randomUUID();
  await db.insert(connectionConversations).values({
    id: sessionId,
    workspaceId: params.workspaceId,
    connectionId: params.connectionId,
    agentId: params.agentId,
    externalParticipantId: params.externalParticipantId,
    title: params.title,
    lastMessageAt: now,
    createdAt: now,
    updatedAt: now,
  });

  return { sessionId, created: true };
}
