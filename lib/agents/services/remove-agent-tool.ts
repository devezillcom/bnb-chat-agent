import { and, eq } from "drizzle-orm";

import { agentTools } from "@/db/schema";
import { db } from "@/lib/db";
import { APIError } from "@/lib/exposers/api-error";
import { deleteTool } from "@/lib/tools/services/delete-tool";

import type {
  AssignAgentCapabilityParams,
  AssignAgentCapabilityResult,
} from "../types";
import { assertAgentInWorkspace } from "../utils/assert-agent-in-workspace";

export async function removeAgentTool(
  params: AssignAgentCapabilityParams,
): Promise<AssignAgentCapabilityResult> {
  await assertAgentInWorkspace(params);

  const [assignment] = await db
    .select({ toolId: agentTools.toolId })
    .from(agentTools)
    .where(
      and(
        eq(agentTools.agentId, params.agentId),
        eq(agentTools.toolId, params.capabilityId),
      ),
    )
    .limit(1);

  if (!assignment) {
    throw new APIError(
      "ERR_AGENT_TOOL_NOT_FOUND",
      "Tool is not assigned to this assistant.",
      404,
    );
  }

  await db
    .delete(agentTools)
    .where(
      and(
        eq(agentTools.agentId, params.agentId),
        eq(agentTools.toolId, params.capabilityId),
      ),
    );

  const remainingAssignments = await db
    .select({ toolId: agentTools.toolId })
    .from(agentTools)
    .where(eq(agentTools.toolId, params.capabilityId))
    .limit(1);

  if (remainingAssignments.length === 0) {
    await deleteTool({
      workspaceId: params.workspaceId,
      toolId: params.capabilityId,
    });
  }

  return { message: "Tool removed from assistant." };
}
