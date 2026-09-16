import { and, asc, eq, inArray } from "drizzle-orm";

import {
  agentKnowledgeBases,
  agentSkills,
  agentTools,
  knowledgeBases,
  skills,
  tools,
} from "@/db/schema";
import { db } from "@/lib/db";

export type AgentCapabilityNames = {
  tools: string[];
  skills: string[];
  knowledgeBases: string[];
};

export type ListAgentCapabilityNamesParams = {
  workspaceId: string;
  agentIds: string[];
};

function createEmptyCapabilityNames(): AgentCapabilityNames {
  return {
    tools: [],
    skills: [],
    knowledgeBases: [],
  };
}

function appendUniqueName(names: string[], value: string) {
  if (!names.includes(value)) {
    names.push(value);
  }
}

export async function listAgentCapabilityNamesByAgentIds(
  params: ListAgentCapabilityNamesParams,
): Promise<Map<string, AgentCapabilityNames>> {
  const capabilityMap = new Map<string, AgentCapabilityNames>();

  if (params.agentIds.length === 0) {
    return capabilityMap;
  }

  for (const agentId of params.agentIds) {
    capabilityMap.set(agentId, createEmptyCapabilityNames());
  }

  const [toolRows, skillRows, knowledgeBaseRows] = await Promise.all([
    db
      .select({
        agentId: agentTools.agentId,
        name: tools.name,
      })
      .from(agentTools)
      .innerJoin(tools, eq(agentTools.toolId, tools.id))
      .where(
        and(
          inArray(agentTools.agentId, params.agentIds),
          eq(tools.workspaceId, params.workspaceId),
        ),
      )
      .orderBy(asc(tools.name), asc(tools.id)),
    db
      .select({
        agentId: agentSkills.agentId,
        name: skills.name,
      })
      .from(agentSkills)
      .innerJoin(skills, eq(agentSkills.skillId, skills.id))
      .where(
        and(
          inArray(agentSkills.agentId, params.agentIds),
          eq(skills.workspaceId, params.workspaceId),
        ),
      )
      .orderBy(asc(skills.name), asc(skills.id)),
    db
      .select({
        agentId: agentKnowledgeBases.agentId,
        name: knowledgeBases.name,
      })
      .from(agentKnowledgeBases)
      .innerJoin(
        knowledgeBases,
        eq(agentKnowledgeBases.knowledgeBaseId, knowledgeBases.id),
      )
      .where(
        and(
          inArray(agentKnowledgeBases.agentId, params.agentIds),
          eq(knowledgeBases.workspaceId, params.workspaceId),
        ),
      )
      .orderBy(asc(knowledgeBases.name), asc(knowledgeBases.id)),
  ]);

  for (const row of toolRows) {
    const capabilities = capabilityMap.get(row.agentId);

    if (capabilities) {
      appendUniqueName(capabilities.tools, row.name);
    }
  }

  for (const row of skillRows) {
    const capabilities = capabilityMap.get(row.agentId);

    if (capabilities) {
      appendUniqueName(capabilities.skills, row.name);
    }
  }

  for (const row of knowledgeBaseRows) {
    const capabilities = capabilityMap.get(row.agentId);

    if (capabilities) {
      appendUniqueName(capabilities.knowledgeBases, row.name);
    }
  }

  return capabilityMap;
}
