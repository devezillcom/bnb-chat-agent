import { agentTools } from "@/db/schema";
import { invalidateChatAgentCache } from "@/lib/chat-agent/services/create-chat-agent";
import { db } from "@/lib/db";
import { createTool } from "@/lib/tools/services/create-tool";

import type { CreateAgentToolParams, CreateAgentToolResult } from "../types";
import { assertAgentInWorkspace } from "../utils/assert-agent-in-workspace";
import { assertAgentToolNameAvailable } from "../utils/assert-agent-tool-name-available";

export async function createAgentTool(
  params: CreateAgentToolParams,
): Promise<CreateAgentToolResult> {
  await assertAgentInWorkspace(params);

  const trimmedName = params.name.trim();

  await assertAgentToolNameAvailable({
    agentId: params.agentId,
    name: trimmedName,
  });

  const { id } = await createTool({
    workspaceId: params.workspaceId,
    name: trimmedName,
    registryToolId: params.registryToolId,
    description: params.description,
    config: params.config,
  });

  await db.insert(agentTools).values({
    agentId: params.agentId,
    toolId: id,
  });

  invalidateChatAgentCache(params.agentId);

  return {
    id,
    message: "Tool added to assistant.",
  };
}
