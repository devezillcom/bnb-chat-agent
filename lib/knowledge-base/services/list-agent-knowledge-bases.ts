import { and, asc, eq, sql } from "drizzle-orm";

import {
  agentKnowledgeBases,
  knowledgeBaseDocuments,
  knowledgeBases,
} from "@/db/schema";
import { db } from "@/lib/db";
import { assertAgentInWorkspace } from "@/lib/agents/utils/assert-agent-in-workspace";

import type {
  ListAgentKnowledgeBasesParams,
  ListAgentKnowledgeBasesResult,
} from "../types";

export async function listAgentKnowledgeBases(
  params: ListAgentKnowledgeBasesParams,
): Promise<ListAgentKnowledgeBasesResult> {
  await assertAgentInWorkspace(params);

  return db
    .select({
      id: knowledgeBases.id,
      name: knowledgeBases.name,
      slug: knowledgeBases.slug,
      description: knowledgeBases.description,
      documentCount: sql<number>`coalesce(count(${knowledgeBaseDocuments.id}), 0)::int`,
    })
    .from(agentKnowledgeBases)
    .innerJoin(
      knowledgeBases,
      eq(agentKnowledgeBases.knowledgeBaseId, knowledgeBases.id),
    )
    .leftJoin(
      knowledgeBaseDocuments,
      eq(knowledgeBaseDocuments.knowledgeBaseId, knowledgeBases.id),
    )
    .where(
      and(
        eq(agentKnowledgeBases.agentId, params.agentId),
        eq(knowledgeBases.workspaceId, params.workspaceId),
      ),
    )
    .groupBy(knowledgeBases.id)
    .orderBy(asc(knowledgeBases.name), asc(knowledgeBases.id));
}
