import { and, asc, eq } from "drizzle-orm";

import { agentTools, tools } from "@/db/schema";
import { db } from "@/lib/db";
import { assertAgentInWorkspace } from "@/lib/agents/utils/assert-agent-in-workspace";

import type { ListAgentToolsParams, ListAgentToolsResult } from "../types";

export async function listAgentTools(
  params: ListAgentToolsParams,
): Promise<ListAgentToolsResult> {
  await assertAgentInWorkspace(params);

  return db
    .select({
      id: tools.id,
      name: tools.name,
      slug: tools.slug,
      registryToolId: tools.registryToolId,
      description: tools.description,
    })
    .from(agentTools)
    .innerJoin(tools, eq(agentTools.toolId, tools.id))
    .where(
      and(
        eq(agentTools.agentId, params.agentId),
        eq(tools.workspaceId, params.workspaceId),
      ),
    )
    .orderBy(asc(tools.name), asc(tools.id));
}
