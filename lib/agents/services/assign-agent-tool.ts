import { and, eq } from "drizzle-orm";

import { agentTools, tools } from "@/db/schema";
import { db } from "@/lib/db";
import { APIError } from "@/lib/exposers/api-error";

import type {
  AssignAgentCapabilityParams,
  AssignAgentCapabilityResult,
} from "../types";
import { assertAgentInWorkspace } from "../utils/assert-agent-in-workspace";

export async function assignAgentTool(
  params: AssignAgentCapabilityParams,
): Promise<AssignAgentCapabilityResult> {
  await assertAgentInWorkspace(params);

  const [tool] = await db
    .select({ id: tools.id })
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

  await db
    .insert(agentTools)
    .values({ agentId: params.agentId, toolId: tool.id })
    .onConflictDoNothing();

  return { message: "Tool added to agent." };
}
