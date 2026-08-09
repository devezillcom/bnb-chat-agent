import { and, eq } from "drizzle-orm";

import { agentTools } from "@/db/schema";
import { db } from "@/lib/db";

import type {
  AssignAgentCapabilityParams,
  AssignAgentCapabilityResult,
} from "../types";
import { assertAgentInWorkspace } from "../utils/assert-agent-in-workspace";

export async function removeAgentTool(
  params: AssignAgentCapabilityParams,
): Promise<AssignAgentCapabilityResult> {
  await assertAgentInWorkspace(params);

  await db
    .delete(agentTools)
    .where(
      and(
        eq(agentTools.agentId, params.agentId),
        eq(agentTools.toolId, params.capabilityId),
      ),
    );

  return { message: "Tool removed from agent." };
}
