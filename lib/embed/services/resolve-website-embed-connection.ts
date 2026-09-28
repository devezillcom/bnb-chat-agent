import { and, eq } from "drizzle-orm";

import { agents, connections } from "@/db/schema";
import { readWebsiteConnectionMetadata } from "@/lib/connections/utils/read-website-connection-metadata";
import { db } from "@/lib/db";
import { APIError } from "@/lib/exposers/api-error";

import type { WebsiteEmbedConnection } from "../types";

type WebsiteEmbedConnectionRow = {
  connectionId: string;
  workspaceId: string;
  agentId: string | null;
  metadata: Record<string, unknown> | null;
  agentName: string | null;
  firstMessage: string | null;
};

function mapWebsiteEmbedConnection(
  row: WebsiteEmbedConnectionRow,
): WebsiteEmbedConnection {
  const metadata = readWebsiteConnectionMetadata(row.metadata);

  if (!metadata || !row.agentId || !row.agentName) {
    throw new APIError(
      "ERR_EMBED_AGENT_REQUIRED",
      "This chat has no agent yet.",
      409,
    );
  }

  return {
    connectionId: row.connectionId,
    workspaceId: row.workspaceId,
    agentId: row.agentId,
    agentName: row.agentName,
    firstMessage: row.firstMessage,
    allowedOrigin: metadata.allowed_origin,
  };
}

const websiteEmbedConnectionSelect = {
  connectionId: connections.id,
  workspaceId: connections.workspaceId,
  agentId: connections.agentId,
  metadata: connections.metadata,
  agentName: agents.name,
  firstMessage: agents.firstMessage,
};

export async function lookupWebsiteEmbedByPublicKey(publicKey: string): Promise<{
  connectionId: string;
  allowedOrigin: string;
  hasAgent: boolean;
} | null> {
  const [row] = await db
    .select(websiteEmbedConnectionSelect)
    .from(connections)
    .leftJoin(agents, eq(connections.agentId, agents.id))
    .where(
      and(
        eq(connections.channelType, "website"),
        eq(connections.publicKey, publicKey),
      ),
    )
    .limit(1);

  if (!row) {
    return null;
  }

  const metadata = readWebsiteConnectionMetadata(row.metadata);

  if (!metadata) {
    return null;
  }

  return {
    connectionId: row.connectionId,
    allowedOrigin: metadata.allowed_origin,
    hasAgent: Boolean(row.agentId && row.agentName),
  };
}

export async function resolveWebsiteEmbedConnectionById(
  connectionId: string,
): Promise<WebsiteEmbedConnection> {
  const [row] = await db
    .select(websiteEmbedConnectionSelect)
    .from(connections)
    .leftJoin(agents, eq(connections.agentId, agents.id))
    .where(
      and(eq(connections.id, connectionId), eq(connections.channelType, "website")),
    )
    .limit(1);

  if (!row) {
    throw new APIError("ERR_EMBED_NOT_FOUND", "Chat not found.", 404);
  }

  return mapWebsiteEmbedConnection(row);
}
