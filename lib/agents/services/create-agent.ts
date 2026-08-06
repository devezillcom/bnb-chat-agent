import { agents } from "@/db/schema";
import { db } from "@/lib/db";

import type { CreateAgentParams, CreateAgentResult } from "../types";

export async function createAgent(
  params: CreateAgentParams,
): Promise<CreateAgentResult> {
  const [agent] = await db
    .insert(agents)
    .values({
      workspaceId: params.workspaceId,
      name: params.name.trim(),
      description: params.description?.trim() || null,
      systemPrompt: params.systemPrompt.trim(),
    })
    .returning({ id: agents.id });

  if (!agent) {
    throw new Error("Failed to create agent.");
  }

  return {
    id: agent.id,
    message: "Agent created.",
  };
}
