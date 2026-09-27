import { and, eq } from "drizzle-orm";

import { agents, connections } from "@/db/schema";
import { db } from "@/lib/db";
import { APIError } from "@/lib/exposers/api-error";

import type {
  ConnectionMutationResult,
  CreateWebsiteConnectionParams,
} from "../types";
import { buildWebsiteConnectionMetadata } from "../utils/build-website-connection-metadata";
import { encryptConnectionAuthData } from "../utils/encrypt-connection-auth-data";
import { normalizeWebsiteUrl } from "../utils/normalize-website-url";

export async function createWebsiteConnection(
  params: CreateWebsiteConnectionParams,
): Promise<ConnectionMutationResult> {
  let normalized: ReturnType<typeof normalizeWebsiteUrl>;

  try {
    normalized = normalizeWebsiteUrl(params.websiteUrl);
  } catch (error) {
    throw new APIError(
      "ERR_WEBSITE_URL_INVALID",
      error instanceof Error ? error.message : "Enter a valid website URL.",
      400,
    );
  }

  const [agent] = await db
    .select({ id: agents.id })
    .from(agents)
    .where(
      and(eq(agents.id, params.agentId), eq(agents.workspaceId, params.workspaceId)),
    )
    .limit(1);

  if (!agent) {
    throw new APIError("ERR_AGENT_NOT_FOUND", "Agent not found.", 404);
  }

  const metadata = buildWebsiteConnectionMetadata({
    websiteUrl: normalized.websiteUrl,
  });

  const [connection] = await db
    .insert(connections)
    .values({
      workspaceId: params.workspaceId,
      userId: params.userId,
      agentId: params.agentId,
      channelType: "website",
      name: params.name.trim(),
      encryptedAuthData: encryptConnectionAuthData({ channel: "website" }),
      metadata,
    })
    .returning({ id: connections.id });

  return {
    id: connection.id,
    message: "Website chat created.",
  };
}
