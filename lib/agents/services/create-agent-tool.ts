import { agentTools } from "@/db/schema";
import { db } from "@/lib/db";
import { createTool } from "@/lib/tools/services/create-tool";

import type { CreateAgentToolParams, CreateAgentToolResult } from "../types";
import { assertAgentInWorkspace } from "../utils/assert-agent-in-workspace";

export async function createAgentTool(
  params: CreateAgentToolParams,
): Promise<CreateAgentToolResult> {
  await assertAgentInWorkspace(params);

  const { id } = await createTool({
    workspaceId: params.workspaceId,
    name: params.name,
    slug: params.slug,
    registryToolId: params.registryToolId,
    description: params.description,
    config: params.config,
  });

  await db.insert(agentTools).values({
    agentId: params.agentId,
    toolId: id,
  });

  return {
    id,
    message: "Tool added to assistant.",
  };
}
