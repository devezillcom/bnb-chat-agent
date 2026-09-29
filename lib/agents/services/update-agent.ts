import { and, eq } from "drizzle-orm";

import { agents } from "@/db/schema";
import { db } from "@/lib/db";
import { APIError } from "@/lib/exposers/api-error";

import type { UpdateAgentParams, UpdateAgentResult } from "../types";
import { buildAgentAvatarPathPrefix } from "../utils/build-agent-avatar-path-prefix";
import { normalizeConversationStarters } from "../utils/normalize-conversation-starters";

const AGENT_AVATAR_FILE_NAME =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|jpeg|png|webp)$/i;

function assertAgentAvatarUrl(params: {
  avatarUrl: string;
  workspaceId: string;
}) {
  const publicUrlBase = process.env.R2_PUBLIC_URL?.replace(/\/$/, "");
  const prefix = publicUrlBase
    ? `${publicUrlBase}/${buildAgentAvatarPathPrefix(params.workspaceId)}/`
    : null;
  const fileName = prefix ? params.avatarUrl.slice(prefix.length) : "";

  if (
    !prefix ||
    !params.avatarUrl.startsWith(prefix) ||
    !AGENT_AVATAR_FILE_NAME.test(fileName)
  ) {
    throw new APIError(
      "ERR_INVALID_INPUT",
      "Avatar must be an uploaded image.",
      400,
    );
  }
}

export async function updateAgent(
  params: UpdateAgentParams,
): Promise<UpdateAgentResult> {
  const changes: {
    name?: string;
    description?: string | null;
    systemPrompt?: string;
    model?: UpdateAgentParams["model"];
    firstMessage?: string | null;
    avatarUrl?: string | null;
    conversationStarters?: string[];
  } = {};

  if (params.name !== undefined) {
    changes.name = params.name.trim();
  }

  if (params.description !== undefined) {
    changes.description = params.description.trim() || null;
  }

  if (params.systemPrompt !== undefined) {
    changes.systemPrompt = params.systemPrompt.trim();
  }

  if (params.model !== undefined) {
    changes.model = params.model;
  }

  if (params.firstMessage !== undefined) {
    changes.firstMessage = params.firstMessage.trim() || null;
  }

  if (params.avatarUrl !== undefined) {
    if (params.avatarUrl) {
      assertAgentAvatarUrl({
        avatarUrl: params.avatarUrl,
        workspaceId: params.workspaceId,
      });
    }

    changes.avatarUrl = params.avatarUrl;
  }

  if (params.conversationStarters !== undefined) {
    changes.conversationStarters = normalizeConversationStarters(
      params.conversationStarters,
    );
  }

  if (Object.keys(changes).length === 0) {
    throw new APIError("ERR_INVALID_INPUT", "No changes to save.", 400);
  }

  const [agent] = await db
    .update(agents)
    .set({
      ...changes,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(agents.id, params.agentId),
        eq(agents.workspaceId, params.workspaceId),
      ),
    )
    .returning({ id: agents.id });

  if (!agent) {
    throw new APIError("ERR_AGENT_NOT_FOUND", "Agent not found.", 404);
  }

  return {
    message: "Agent updated.",
  };
}
