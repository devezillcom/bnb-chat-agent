import { and, eq } from "drizzle-orm";

import { agentTools, tools } from "@/db/schema";
import { invalidateChatAgentCache } from "@/lib/chat-agent/services/create-chat-agent";
import { db } from "@/lib/db";
import { APIError } from "@/lib/exposers/api-error";

import type {
  AssignAgentCapabilityParams,
  AssignAgentCapabilityResult,
} from "../types";
import { assertAgentInWorkspace } from "../utils/assert-agent-in-workspace";
import { assertAgentToolNameAvailable } from "../utils/assert-agent-tool-name-available";

export async function assignAgentTool(
  params: AssignAgentCapabilityParams,
): Promise<AssignAgentCapabilityResult> {
  await assertAgentInWorkspace(params);

  const [tool] = await db
    .select({ id: tools.id, name: tools.name })
    .from(tools)
    .where(
      and(
        eq(tools.id, params.capabilityId),
        eq(tools.workspaceId, params.workspaceId),
      ),
    )
    .limit(1);

  if (!tool) {
    throw new APIError("ERR_TOOL_NOT_FOUND", "Tool not found.", 404);
  }

  const [existingAssignment] = await db
    .select({ toolId: agentTools.toolId })
    .from(agentTools)
    .where(
      and(
        eq(agentTools.agentId, params.agentId),
        eq(agentTools.toolId, tool.id),
      ),
    )
    .limit(1);

  if (!existingAssignment) {
    await assertAgentToolNameAvailable({
      agentId: params.agentId,
      name: tool.name,
    });
  }

  await db
    .insert(agentTools)
    .values({ agentId: params.agentId, toolId: tool.id })
    .onConflictDoNothing();

  invalidateChatAgentCache(params.agentId);

  return { message: "Tool added to agent." };
}
