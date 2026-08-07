import type { ConnectionAgentSummary, ConnectionListItem } from "../types";

type ConnectionRow = {
  id: string;
  channelType: string;
  name: string;
  metadata: Record<string, unknown> | null;
  lastError: string | null;
  createdAt: Date;
  updatedAt: Date;
  agentId: string | null;
  agentName: string | null;
};

export function mapConnectionRow(row: ConnectionRow): ConnectionListItem {
  const agent: ConnectionAgentSummary | null =
    row.agentId && row.agentName
      ? { id: row.agentId, name: row.agentName }
      : null;

  return {
    id: row.id,
    channelType: row.channelType,
    name: row.name,
    metadata: row.metadata ?? null,
    lastError: row.lastError ?? null,
    agent,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export const connectionSelectFields = {
  id: true as const,
  channelType: true as const,
  name: true as const,
  metadata: true as const,
  lastError: true as const,
  createdAt: true as const,
  updatedAt: true as const,
  agentId: true as const,
};
