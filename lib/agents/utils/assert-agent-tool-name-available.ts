import "server-only";

import { and, eq, ne } from "drizzle-orm";

import { agentKnowledgeBases, agentTools, tools } from "@/db/schema";
import { slugifyName } from "@/lib/common/slugify-name";
import { db } from "@/lib/db";
import { APIError } from "@/lib/exposers/api-error";
import { KNOWLEDGE_BASE_SEARCH_TOOL_NAME } from "@/lib/knowledge-base/constants";

export type AssertAgentToolNameAvailableParams = {
  agentId: string;
  name: string;
  excludeToolId?: string;
};

export async function assertAgentToolNameAvailable(
  params: AssertAgentToolNameAvailableParams,
): Promise<void> {
  const trimmedName = params.name.trim();
  const slug = slugifyName(trimmedName, "tool");

  const conditions = [eq(agentTools.agentId, params.agentId)];

  if (params.excludeToolId) {
    conditions.push(ne(agentTools.toolId, params.excludeToolId));
  }

  const [assignedTools, knowledgeBaseAssignment] = await Promise.all([
    db
      .select({ name: tools.name })
      .from(agentTools)
      .innerJoin(tools, eq(agentTools.toolId, tools.id))
      .where(and(...conditions)),
    db
      .select({ agentId: agentKnowledgeBases.agentId })
      .from(agentKnowledgeBases)
      .where(eq(agentKnowledgeBases.agentId, params.agentId))
      .limit(1),
  ]);

  for (const tool of assignedTools) {
    if (slugifyName(tool.name, "tool") === slug) {
      throw new APIError(
        "ERR_AGENT_TOOL_NAME_TAKEN",
        `This assistant already has a tool named "${trimmedName}". Each tool needs a unique name.`,
        409,
      );
    }
  }

  if (knowledgeBaseAssignment && slug === KNOWLEDGE_BASE_SEARCH_TOOL_NAME) {
    throw new APIError(
      "ERR_AGENT_TOOL_NAME_RESERVED",
      `"${trimmedName}" cannot be used because this assistant already has a knowledge base connected.`,
      409,
    );
  }
}
