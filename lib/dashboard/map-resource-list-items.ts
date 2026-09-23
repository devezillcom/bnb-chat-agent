import type { ResourceListRowItem } from "@/components/dashboard/resource-list-page";
import type { AgentListItemWithCapabilities } from "@/lib/agents/types";
import { getAgentListLeading } from "@/lib/agents/utils/get-agent-list-leading";
import type { ChatAgent, Connection } from "@/lib/dashboard/placeholder-data";

const CONNECTION_CHANNEL_LABELS: Record<Connection["channel"], string> = {
  facebook: "Facebook",
  website: "Website",
  whatsapp: "WhatsApp",
  telegram: "Telegram",
};

export function mapAgentsToListItems(
  agents: AgentListItemWithCapabilities[],
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
