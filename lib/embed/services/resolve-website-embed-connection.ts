import { and, eq } from "drizzle-orm";

import { agents, connections } from "@/db/schema";
import { normalizeConversationStarters } from "@/lib/agents/utils/normalize-conversation-starters";
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
  avatarUrl: string | null;
  conversationStarters: string[] | null;
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
    allowAllOrigins: metadata.allow_all_origins,
    allowedOrigins: metadata.allowed_origins,
  };
}

const websiteEmbedConnectionSelect = {
  connectionId: connections.id,
  workspaceId: connections.workspaceId,
  agentId: connections.agentId,
  metadata: connections.metadata,
  agentName: agents.name,
  firstMessage: agents.firstMessage,
  avatarUrl: agents.avatarUrl,
  conversationStarters: agents.conversationStarters,
};

export async function lookupWebsiteEmbedByPublicKey(publicKey: string): Promise<{
  connectionId: string;
  allowAllOrigins: boolean;
  allowedOrigins: string[];
  hasAgent: boolean;
  avatarUrl: string | null;
  conversationStarters: string[];
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
    allowAllOrigins: metadata.allow_all_origins,
    allowedOrigins: metadata.allowed_origins,
    hasAgent: Boolean(row.agentId && row.agentName),
    avatarUrl: row.avatarUrl,
    conversationStarters: normalizeConversationStarters(
      row.conversationStarters,
    ),
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
