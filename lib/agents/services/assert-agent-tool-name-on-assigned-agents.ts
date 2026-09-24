import "server-only";

import { eq } from "drizzle-orm";

import { agentTools } from "@/db/schema";
import { db } from "@/lib/db";

import { assertAgentToolNameAvailable } from "../utils/assert-agent-tool-name-available";

export type AssertAgentToolNameOnAssignedAgentsParams = {
  toolId: string;
  name: string;
};

export async function assertAgentToolNameOnAssignedAgents(
  params: AssertAgentToolNameOnAssignedAgentsParams,
): Promise<string[]> {
  const assignments = await db
    .select({ agentId: agentTools.agentId })
    .from(agentTools)
    .where(eq(agentTools.toolId, params.toolId));

  for (const { agentId } of assignments) {
    await assertAgentToolNameAvailable({
      agentId,
      name: params.name,
      excludeToolId: params.toolId,
    });
  }

  return assignments.map((row) => row.agentId);
}
