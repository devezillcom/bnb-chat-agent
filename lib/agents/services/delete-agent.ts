import { and, eq } from "drizzle-orm";

import {
  agentKnowledgeBases,
  agentSkills,
  agentTools,
  agents,
  tools,
} from "@/db/schema";
import { invalidateChatAgentCache } from "@/lib/chat-agent/services/create-chat-agent";
import { db } from "@/lib/db";
import { APIError } from "@/lib/exposers/api-error";
import { deleteKnowledgeBase } from "@/lib/knowledge-base/services/delete-knowledge-base";
import { deleteSkill } from "@/lib/skills/services/delete-skill";
import { deleteTool } from "@/lib/tools/services/delete-tool";

import type { DeleteAgentParams, DeleteAgentResult } from "../types";

export async function deleteAgent(
  params: DeleteAgentParams,
): Promise<DeleteAgentResult> {
  const [existingAgent] = await db
    .select({ id: agents.id })
    .from(agents)
    .where(
      and(
        eq(agents.id, params.agentId),
        eq(agents.workspaceId, params.workspaceId),
      ),
    )
    .limit(1);

  if (!existingAgent) {
    throw new APIError("ERR_AGENT_NOT_FOUND", "Agent not found.", 404);
  }

  const [linkedSkills, linkedTools, linkedKnowledgeBases] = await Promise.all([
    db
      .select({ skillId: agentSkills.skillId })
      .from(agentSkills)
      .where(eq(agentSkills.agentId, params.agentId)),
    db
      .select({ toolId: agentTools.toolId, locked: tools.locked })
      .from(agentTools)
      .innerJoin(tools, eq(agentTools.toolId, tools.id))
      .where(eq(agentTools.agentId, params.agentId)),
    db
      .select({ knowledgeBaseId: agentKnowledgeBases.knowledgeBaseId })
      .from(agentKnowledgeBases)
      .where(eq(agentKnowledgeBases.agentId, params.agentId)),
  ]);

  await db
    .delete(agents)
    .where(
      and(
        eq(agents.id, params.agentId),
        eq(agents.workspaceId, params.workspaceId),
      ),
    );

  invalidateChatAgentCache(params.agentId);

  for (const { knowledgeBaseId } of linkedKnowledgeBases) {
    const remainingAssignments = await db
      .select({ knowledgeBaseId: agentKnowledgeBases.knowledgeBaseId })
      .from(agentKnowledgeBases)
      .where(eq(agentKnowledgeBases.knowledgeBaseId, knowledgeBaseId))
      .limit(1);

    if (remainingAssignments.length === 0) {
      await deleteKnowledgeBase({
        workspaceId: params.workspaceId,
        knowledgeBaseId,
      });
    }
  }

  for (const { skillId } of linkedSkills) {
    const remainingAssignments = await db
      .select({ skillId: agentSkills.skillId })
      .from(agentSkills)
      .where(eq(agentSkills.skillId, skillId))
      .limit(1);

    if (remainingAssignments.length === 0) {
      await deleteSkill({
        workspaceId: params.workspaceId,
        skillId,
      });
    }
  }

  for (const { toolId, locked } of linkedTools) {
    if (locked) {
      continue;
    }

    const remainingAssignments = await db
      .select({ toolId: agentTools.toolId })
      .from(agentTools)
      .where(eq(agentTools.toolId, toolId))
      .limit(1);

    if (remainingAssignments.length === 0) {
      await deleteTool({
        workspaceId: params.workspaceId,
        toolId,
      });
    }
  }

  return { message: "Agent deleted." };
}
