import { and, eq } from "drizzle-orm";

import { agents } from "@/db/schema";
import { db } from "@/lib/db";
import { APIError } from "@/lib/exposers/api-error";

import type { GetAgentParams, GetAgentResult } from "../types";

export async function getAgent(params: GetAgentParams): Promise<GetAgentResult> {
  const [row] = await db
    .select({
      id: agents.id,
      name: agents.name,
      description: agents.description,
      systemPrompt: agents.systemPrompt,
      createdAt: agents.createdAt,
      updatedAt: agents.updatedAt,
    })
    .from(agents)
    .where(
      and(
        eq(agents.id, params.agentId),
        eq(agents.workspaceId, params.workspaceId),
      ),
    )
    .limit(1);

  if (!row) {
    throw new APIError("ERR_AGENT_NOT_FOUND", "Agent not found.", 404);
  }

  return {
    id: row.id,
    name: row.name,
    description: row.description,
    systemPrompt: row.systemPrompt,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
