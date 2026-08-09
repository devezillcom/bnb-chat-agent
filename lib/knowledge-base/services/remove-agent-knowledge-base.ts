import { and, eq } from "drizzle-orm";

import { agentKnowledgeBases } from "@/db/schema";
import { db } from "@/lib/db";
import { assertAgentInWorkspace } from "@/lib/agents/utils/assert-agent-in-workspace";

import type {
  AssignAgentKnowledgeBaseParams,
  AssignAgentKnowledgeBaseResult,
} from "../types";

export async function removeAgentKnowledgeBase(
  params: AssignAgentKnowledgeBaseParams,
): Promise<AssignAgentKnowledgeBaseResult> {
  await assertAgentInWorkspace(params);

  await db
    .delete(agentKnowledgeBases)
    .where(
      and(
        eq(agentKnowledgeBases.agentId, params.agentId),
        eq(agentKnowledgeBases.knowledgeBaseId, params.knowledgeBaseId),
      ),
    );

  return { message: "Knowledge base removed from agent." };
}
