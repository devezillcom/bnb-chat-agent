import { and, eq } from "drizzle-orm";

import { agents } from "@/db/schema";
import { db } from "@/lib/db";
import { APIError } from "@/lib/exposers/api-error";

import type { DeleteAgentParams, DeleteAgentResult } from "../types";

export async function deleteAgent(
  params: DeleteAgentParams,
): Promise<DeleteAgentResult> {
  const deleted = await db
    .delete(agents)
    .where(
      and(
        eq(agents.id, params.agentId),
        eq(agents.workspaceId, params.workspaceId),
      ),
    )
    .returning({ id: agents.id });

  if (deleted.length === 0) {
    throw new APIError("ERR_AGENT_NOT_FOUND", "Agent not found.", 404);
  }

  return { message: "Agent deleted." };
}
