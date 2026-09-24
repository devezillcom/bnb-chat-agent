import { and, eq } from "drizzle-orm";

import { agentTools, tools } from "@/db/schema";
import { db } from "@/lib/db";
import { APIError } from "@/lib/exposers/api-error";

import { assertAgentToolNameOnAssignedAgents } from "@/lib/agents/services/assert-agent-tool-name-on-assigned-agents";
import { invalidateChatAgentCache } from "@/lib/chat-agent/services/create-chat-agent";

import type { UpdateToolParams, UpdateToolResult } from "../types";
import { normalizeToolConfig } from "../utils/normalize-tool-config";

export async function updateTool(
  params: UpdateToolParams,
): Promise<UpdateToolResult> {
  const [existing] = await db
    .select({
      id: tools.id,
      name: tools.name,
      locked: tools.locked,
      registryToolId: tools.registryToolId,
    })
    .from(tools)
    .where(
      and(eq(tools.id, params.toolId), eq(tools.workspaceId, params.workspaceId)),
    )
    .limit(1);

  if (!existing) {
    throw new APIError("ERR_TOOL_NOT_FOUND", "Tool not found.", 404);
  }

  if (existing.locked) {
    throw new APIError(
      "ERR_TOOL_LOCKED",
      "This tool is locked and cannot be modified.",
      403,
    );
  }

  const trimmedName = params.name.trim();
  const registryToolId = params.registryToolId.trim();

  if (registryToolId !== existing.registryToolId) {
    throw new APIError(
      "ERR_TOOL_REGISTRY_ID_IMMUTABLE",
      "Registry tool cannot be changed after creation.",
      400,
    );
  }

  let config: Record<string, unknown>;

  try {
    config = normalizeToolConfig(registryToolId, params.config);
  } catch (error) {
    throw new APIError(
      "ERR_TOOL_CONFIG_INVALID",
      error instanceof Error ? error.message : "Invalid tool configuration.",
      400,
    );
  }

  if (trimmedName !== existing.name) {
    await assertAgentToolNameOnAssignedAgents({
      toolId: params.toolId,
      name: trimmedName,
    });
  }

  const updated = await db
    .update(tools)
    .set({
      name: trimmedName,
      description: params.description?.trim() || null,
      config,
      updatedAt: new Date(),
    })
    .where(
      and(eq(tools.id, params.toolId), eq(tools.workspaceId, params.workspaceId)),
    )
    .returning({ id: tools.id });

  if (updated.length === 0) {
    throw new APIError("ERR_TOOL_NOT_FOUND", "Tool not found.", 404);
  }

  const assignedAgents = await db
    .select({ agentId: agentTools.agentId })
    .from(agentTools)
    .where(eq(agentTools.toolId, params.toolId));

  for (const { agentId } of assignedAgents) {
    invalidateChatAgentCache(agentId);
  }

  return { message: "Tool updated." };
}
