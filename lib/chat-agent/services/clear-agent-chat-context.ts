import { and, eq } from "drizzle-orm";

import { chatAgentSessions } from "@/db/schema";
import { assertAgentInWorkspace } from "@/lib/agents/utils/assert-agent-in-workspace";
import { db } from "@/lib/db";

import type {
  ClearAgentChatContextParams,
  ClearAgentChatContextResult,
} from "../types";
import { getChatAgentCheckpointer } from "../utils/get-chat-agent-checkpointer";
import { invalidateChatAgentCache } from "./create-chat-agent";

export async function clearAgentChatContext(
  params: ClearAgentChatContextParams,
): Promise<ClearAgentChatContextResult> {
  await assertAgentInWorkspace({
    agentId: params.agentId,
    workspaceId: params.workspaceId,
  });

  const sessions = await db
    .select({ id: chatAgentSessions.id })
    .from(chatAgentSessions)
    .where(
      and(
        eq(chatAgentSessions.agentId, params.agentId),
        eq(chatAgentSessions.workspaceId, params.workspaceId),
      ),
    );

  if (sessions.length > 0) {
    const checkpointer = await getChatAgentCheckpointer();
    await Promise.all(
      sessions.map((session) => checkpointer.deleteThread(session.id)),
    );

    await db
      .delete(chatAgentSessions)
      .where(
        and(
          eq(chatAgentSessions.agentId, params.agentId),
          eq(chatAgentSessions.workspaceId, params.workspaceId),
        ),
      );
  }

  invalidateChatAgentCache(params.agentId);

  return { message: "Chat context cleared." };
}
