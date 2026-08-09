import { and, eq } from "drizzle-orm";

import { agentKnowledgeBases, knowledgeBases } from "@/db/schema";
import { db } from "@/lib/db";
import { APIError } from "@/lib/exposers/api-error";
import { assertAgentInWorkspace } from "@/lib/agents/utils/assert-agent-in-workspace";

import type {
  AssignAgentKnowledgeBaseParams,
  AssignAgentKnowledgeBaseResult,
} from "../types";

export async function assignAgentKnowledgeBase(
  params: AssignAgentKnowledgeBaseParams,
): Promise<AssignAgentKnowledgeBaseResult> {
  await assertAgentInWorkspace(params);

  const [knowledgeBase] = await db
    .select({ id: knowledgeBases.id })
    .from(knowledgeBases)
    .where(
      and(
        eq(knowledgeBases.id, params.knowledgeBaseId),
        eq(knowledgeBases.workspaceId, params.workspaceId),
      ),
    )
    .limit(1);

  if (!knowledgeBase) {
    throw new APIError(
      "ERR_KNOWLEDGE_BASE_NOT_FOUND",
      "Knowledge base not found.",
      404,
    );
  }

  await db
    .insert(agentKnowledgeBases)
    .values({
      agentId: params.agentId,
      knowledgeBaseId: knowledgeBase.id,
    })
    .onConflictDoNothing();

  return { message: "Knowledge base added to agent." };
}
