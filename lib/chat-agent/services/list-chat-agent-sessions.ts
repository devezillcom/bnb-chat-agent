import { and, desc, eq, ilike } from "drizzle-orm";

import { chatAgentSessions } from "@/db/schema";
import { db } from "@/lib/db";

import type {
  ListChatAgentSessionsParams,
  ListChatAgentSessionsResult,
} from "../types";

export async function listChatAgentSessions(
  params: ListChatAgentSessionsParams,
): Promise<ListChatAgentSessionsResult> {
  const keyword = params.keyword?.trim();
  const conditions = [
    eq(chatAgentSessions.workspaceId, params.workspaceId),
    eq(chatAgentSessions.userId, params.userId),
    eq(chatAgentSessions.agentId, params.agentId),
    eq(chatAgentSessions.chatEnv, params.chatEnv),
  ];

  if (keyword) {
    conditions.push(ilike(chatAgentSessions.title, `%${keyword}%`));
  }

  const rows = await db
    .select({
      id: chatAgentSessions.id,
      title: chatAgentSessions.title,
      chatEnv: chatAgentSessions.chatEnv,
      createdAt: chatAgentSessions.createdAt,
      updatedAt: chatAgentSessions.updatedAt,
    })
    .from(chatAgentSessions)
    .where(and(...conditions))
    .orderBy(desc(chatAgentSessions.updatedAt), desc(chatAgentSessions.id))
    .limit(params.limit);

  return {
    items: rows.map((row) => ({
      id: row.id,
      title: row.title,
      chatEnv: row.chatEnv as ListChatAgentSessionsParams["chatEnv"],
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    })),
  };
}
