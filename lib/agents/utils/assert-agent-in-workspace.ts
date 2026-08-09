import { and, eq } from "drizzle-orm";

import { agents } from "@/db/schema";
import { db } from "@/lib/db";
import { APIError } from "@/lib/exposers/api-error";

export async function assertAgentInWorkspace(params: {
  agentId: string;
  workspaceId: string;
}) {
  const [agent] = await db
    .select({ id: agents.id })
    .from(agents)
    .where(
      and(
        eq(agents.id, params.agentId),
        eq(agents.workspaceId, params.workspaceId),
      ),
    )
    .limit(1);

  if (!agent) {
    throw new APIError("ERR_AGENT_NOT_FOUND", "Agent not found.", 404);
  }
}
