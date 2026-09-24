import "server-only";

import { and, asc, eq } from "drizzle-orm";

import { agentKnowledgeBases, knowledgeBases } from "@/db/schema";
import { db } from "@/lib/db";

import type {
  AgentKnowledgeBaseRef,
  ListAgentKnowledgeBaseRefsParams,
} from "../types";

export async function listAgentKnowledgeBaseRefs(
  params: ListAgentKnowledgeBaseRefsParams,
): Promise<AgentKnowledgeBaseRef[]> {
  return db
    .select({
      id: knowledgeBases.id,
      name: knowledgeBases.name,
      description: knowledgeBases.description,
    })
    .from(agentKnowledgeBases)
    .innerJoin(
      knowledgeBases,
      eq(agentKnowledgeBases.knowledgeBaseId, knowledgeBases.id),
    )
    .where(
      and(
        eq(agentKnowledgeBases.agentId, params.agentId),
        eq(knowledgeBases.workspaceId, params.workspaceId),
      ),
    )
    .orderBy(asc(knowledgeBases.name), asc(knowledgeBases.id));
}
