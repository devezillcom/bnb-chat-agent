import { and, eq } from "drizzle-orm";

import { agents, connections } from "@/db/schema";
import { db } from "@/lib/db";
import { APIError } from "@/lib/exposers/api-error";

import type {
  ConnectionMutationResult,
  CreateWebsiteConnectionParams,
} from "../types";
import { buildWebsiteConnectionMetadata } from "../utils/build-website-connection-metadata";
import { createWebsitePublicKey } from "../utils/create-website-public-key";
import { encryptConnectionAuthData } from "../utils/encrypt-connection-auth-data";

export async function createWebsiteConnection(
  params: CreateWebsiteConnectionParams,
): Promise<ConnectionMutationResult> {
  let metadata: ReturnType<typeof buildWebsiteConnectionMetadata>;

  try {
    metadata = buildWebsiteConnectionMetadata({
      allowAllOrigins: params.allowAllOrigins,
      allowedOrigins: params.allowedOrigins,
    });
  } catch (error) {
    throw new APIError(
      "ERR_WEBSITE_ORIGINS_INVALID",
      error instanceof Error ? error.message : "Enter a valid website domain.",
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

  const [connection] = await db
    .insert(connections)
    .values({
      workspaceId: params.workspaceId,
      userId: params.userId,
      agentId: params.agentId,
      channelType: "website",
      name: params.name.trim(),
      encryptedAuthData: encryptConnectionAuthData({ channel: "website" }),
      publicKey: createWebsitePublicKey(),
      metadata,
    })
    .returning({ id: connections.id });

  return {
    id: connection.id,
    message: "Website chat created.",
  };
}
