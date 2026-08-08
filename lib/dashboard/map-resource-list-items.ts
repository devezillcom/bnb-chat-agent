import type { ResourceListRowItem } from "@/components/dashboard/resource-list-page";
import type { AgentListItem } from "@/lib/agents/types";
import { getAgentListLeading } from "@/lib/agents/utils/get-agent-list-leading";
import type {
  ChatAgent,
  Connection,
  KnowledgeBase,
  Skill,
} from "@/lib/dashboard/placeholder-data";
import type { ToolListItem } from "@/lib/tools/types";
import { getToolHandlerDefinition } from "@/lib/tools/tool-handler-registry";

const CONNECTION_CHANNEL_LABELS: Record<Connection["channel"], string> = {
  facebook: "Facebook",
  website: "Website",
  whatsapp: "WhatsApp",
  telegram: "Telegram",
};

export function mapAgentsToListItems(
  agents: AgentListItem[],
): ResourceListRowItem[] {
  return agents.map((agent) => ({
    id: agent.id,
    name: agent.name,
    description: agent.description ?? undefined,
    createdAt: agent.createdAt,
    leading: getAgentListLeading(agent.name),
  }));
}

export function mapChatAgentsToListItems(
  agents: ChatAgent[],
): ResourceListRowItem[] {
  return agents.map((agent) => ({
    id: agent.id,
    name: agent.name,
    description: agent.description,
    createdAt: agent.createdAt,
    subtitle: agent.role,
    leading: {
      initials: agent.initials,
      className: agent.avatarColor,
    },
  }));
}

export function mapSkillsToListItems(skills: Skill[]): ResourceListRowItem[] {
  return skills.map((skill) => ({
    id: skill.id,
    name: skill.name,
    description: skill.description,
    createdAt: skill.createdAt,
    subtitle: skill.category,
    meta:
      skill.agentCount === 1
        ? "1 agent"
        : `${skill.agentCount} agents`,
  }));
}

export function mapToolsToListItems(tools: ToolListItem[]): ResourceListRowItem[] {
  return tools.map((tool) => {
    const handler = getToolHandlerDefinition(tool.handlerType);

    return {
      id: tool.id,
      name: tool.name,
      description: tool.description ?? undefined,
      createdAt: tool.createdAt,
      subtitle: handler?.name ?? tool.handlerType,
      meta: tool.handlerKey,
      badge: tool.locked
        ? {
            label: "Locked",
            className: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
          }
        : undefined,
    };
  });
}

export function mapKnowledgeBasesToListItems(
  knowledgeBases: KnowledgeBase[],
): ResourceListRowItem[] {
  return knowledgeBases.map((knowledgeBase) => ({
    id: knowledgeBase.id,
    name: knowledgeBase.name,
    description: knowledgeBase.description,
    createdAt: knowledgeBase.createdAt,
    meta:
      knowledgeBase.documentCount === 1
        ? "1 document"
        : `${knowledgeBase.documentCount} documents`,
  }));
}

export function mapConnectionsToListItems(
  connections: Connection[],
): ResourceListRowItem[] {
  return connections.map((connection) => ({
    id: connection.id,
    name: connection.name,
    description: connection.description,
    createdAt: connection.createdAt,
    subtitle: `Agent: ${connection.agentName}`,
    badge: {
      label: CONNECTION_CHANNEL_LABELS[connection.channel],
      className: "bg-muted text-muted-foreground",
    },
    meta: connection.status.charAt(0).toUpperCase() + connection.status.slice(1),
    leading: {
      initials: CONNECTION_CHANNEL_LABELS[connection.channel].charAt(0),
      className: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
    },
  }));
}
