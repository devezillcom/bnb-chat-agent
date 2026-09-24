import "server-only";

import { and, asc, eq } from "drizzle-orm";

import { agentTools, tools } from "@/db/schema";
import { slugifyName } from "@/lib/common/slugify-name";
import { db } from "@/lib/db";

export type ListAgentToolRefsParams = {
  agentId: string;
  workspaceId: string;
};

export type AgentToolRef = {
  id: string;
  name: string;
  slug: string;
};

/** Tools assigned to an agent, ordered by creation for stable tool order. */
export async function listAgentToolRefs(
  params: ListAgentToolRefsParams,
): Promise<AgentToolRef[]> {
  const rows = await db
    .select({
      id: tools.id,
      name: tools.name,
    })
    .from(agentTools)
    .innerJoin(tools, eq(agentTools.toolId, tools.id))
    .where(
      and(
        eq(agentTools.agentId, params.agentId),
        eq(tools.workspaceId, params.workspaceId),
      ),
    )
    .orderBy(asc(tools.createdAt), asc(tools.id));

  return rows.map((row) => ({
    ...row,
    slug: slugifyName(row.name, "tool"),
  }));
}
