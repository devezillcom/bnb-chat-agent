import "server-only";

import { and, eq } from "drizzle-orm";

import { agentTools, tools } from "@/db/schema";
import { db } from "@/lib/db";

export type ListAgentToolSlugsParams = {
  agentId: string;
  workspaceId: string;
};

export async function listAgentToolSlugs(
  params: ListAgentToolSlugsParams,
): Promise<string[]> {
  const rows = await db
    .select({ slug: tools.slug })
    .from(agentTools)
    .innerJoin(tools, eq(agentTools.toolId, tools.id))
    .where(
      and(
        eq(agentTools.agentId, params.agentId),
        eq(tools.workspaceId, params.workspaceId),
      ),
    );

  return rows.map((row) => row.slug);
}
