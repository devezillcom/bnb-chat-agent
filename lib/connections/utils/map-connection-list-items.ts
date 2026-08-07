import type { ResourceListRowItem } from "@/components/dashboard/resource-list-page";
import type { ConnectionListItem } from "@/lib/connections/types";
import {
  getConnectionAvatarUrl,
  getConnectionTypeLabel,
} from "./connection-display-utils";

export function mapConnectionListItemsToResourceRows(
  connections: ConnectionListItem[],
): ResourceListRowItem[] {
  return connections.map((connection) => {
    const avatarUrl = getConnectionAvatarUrl(connection.metadata);
    const subtitle = connection.agent
      ? `Agent: ${connection.agent.name}`
      : "No agent assigned";

    return {
      id: connection.id,
      name: connection.name,
      createdAt: connection.createdAt,
      subtitle,
      badge: {
        label: getConnectionTypeLabel(connection.channelType),
        className: "bg-muted text-muted-foreground",
      },
      meta: connection.lastError
        ? "Connection error"
        : connection.agent
          ? "Assigned"
          : "Unassigned",
      avatarUrl: avatarUrl ?? undefined,
      leading: avatarUrl
        ? {
            initials: "",
            className: "bg-transparent p-0 overflow-hidden",
          }
        : {
            initials: getConnectionTypeLabel(connection.channelType).charAt(0),
            className:
              "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
          },
    };
  });
}
