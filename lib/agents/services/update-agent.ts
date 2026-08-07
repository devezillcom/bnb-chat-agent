import { and, eq } from "drizzle-orm";

import { agents } from "@/db/schema";
import { db } from "@/lib/db";
import { APIError } from "@/lib/exposers/api-error";

import type { UpdateAgentParams, UpdateAgentResult } from "../types";

export async function updateAgent(
  params: UpdateAgentParams,
): Promise<UpdateAgentResult> {
  const [agent] = await db
    .update(agents)
    .set({
      name: params.name.trim(),
      description: params.description?.trim() || null,
      systemPrompt: params.systemPrompt.trim(),
      firstMessage: params.firstMessage?.trim() || null,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(agents.id, params.agentId),
        eq(agents.workspaceId, params.workspaceId),
      ),
    )
    .returning({ id: agents.id });

  if (!agent) {
    throw new APIError("ERR_AGENT_NOT_FOUND", "Agent not found.", 404);
  }

  return {
    message: "Agent updated.",
  };
}
