import { and, eq } from "drizzle-orm";

import { tools } from "@/db/schema";
import { db } from "@/lib/db";
import { APIError } from "@/lib/exposers/api-error";

import type { CreateToolParams, CreateToolResult } from "../types";
import { normalizeToolConfig } from "../utils/normalize-tool-config";

export async function createTool(
  params: CreateToolParams,
): Promise<CreateToolResult> {
  const trimmedName = params.name.trim();
  const handlerKey = params.handlerKey.trim();
  const handlerType = params.handlerType.trim();

  const [existing] = await db
    .select({ id: tools.id })
    .from(tools)
    .where(
      and(
        eq(tools.workspaceId, params.workspaceId),
        eq(tools.handlerKey, handlerKey),
      ),
    )
    .limit(1);

  if (existing) {
    throw new APIError(
      "ERR_TOOL_HANDLER_KEY_EXISTS",
      "A tool with this handler key already exists in the workspace.",
      409,
    );
  }

  let config: Record<string, string>;

  try {
    config = normalizeToolConfig(handlerType, params.config);
  } catch (error) {
    throw new APIError(
      "ERR_TOOL_CONFIG_INVALID",
      error instanceof Error ? error.message : "Invalid tool configuration.",
      400,
    );
  }

  const [tool] = await db
    .insert(tools)
    .values({
      workspaceId: params.workspaceId,
      name: trimmedName,
      handlerKey,
      handlerType,
      description: params.description?.trim() || null,
      config,
      locked: false,
    })
    .returning({ id: tools.id });

  if (!tool) {
    throw new Error("Failed to create tool.");
  }

  return {
    id: tool.id,
    message: "Tool created.",
  };
}
