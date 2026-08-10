import "server-only";

import { and, eq } from "drizzle-orm";

import { agentKnowledgeBases, knowledgeBases } from "@/db/schema";
import { db } from "@/lib/db";

import type { ListAgentKnowledgeBaseIdsParams } from "../types";

export async function listAgentKnowledgeBaseIds(
  params: ListAgentKnowledgeBaseIdsParams,
): Promise<string[]> {
  const rows = await db
    .select({ id: knowledgeBases.id })
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
    );

  return rows.map((row) => row.id);
}
