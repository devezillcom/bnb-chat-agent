import { and, eq } from "drizzle-orm";

import { tools } from "@/db/schema";
import { db } from "@/lib/db";
import { APIError } from "@/lib/exposers/api-error";

import type { UpdateToolParams, UpdateToolResult } from "../types";
import { normalizeToolConfig } from "../utils/normalize-tool-config";

export async function updateTool(
  params: UpdateToolParams,
): Promise<UpdateToolResult> {
  const [existing] = await db
    .select({
      id: tools.id,
      locked: tools.locked,
      handlerKey: tools.handlerKey,
      handlerType: tools.handlerType,
    })
    .from(tools)
    .where(
      and(eq(tools.id, params.toolId), eq(tools.workspaceId, params.workspaceId)),
    )
    .limit(1);

  if (!existing) {
    throw new APIError("ERR_TOOL_NOT_FOUND", "Tool not found.", 404);
  }

  if (existing.locked) {
    throw new APIError(
      "ERR_TOOL_LOCKED",
      "This tool is locked and cannot be modified.",
      403,
    );
  }

  const trimmedName = params.name.trim();
  const handlerKey = params.handlerKey.trim();
  const handlerType = params.handlerType.trim();

  if (handlerKey !== existing.handlerKey) {
    throw new APIError(
      "ERR_TOOL_HANDLER_KEY_IMMUTABLE",
      "Handler key cannot be changed after creation.",
      400,
    );
  }

  if (handlerType !== existing.handlerType) {
    throw new APIError(
      "ERR_TOOL_HANDLER_TYPE_IMMUTABLE",
      "Handler type cannot be changed after creation.",
      400,
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

  const updated = await db
    .update(tools)
    .set({
      name: trimmedName,
      description: params.description?.trim() || null,
      config,
      updatedAt: new Date(),
    })
    .where(
      and(eq(tools.id, params.toolId), eq(tools.workspaceId, params.workspaceId)),
    )
    .returning({ id: tools.id });

  if (updated.length === 0) {
    throw new APIError("ERR_TOOL_NOT_FOUND", "Tool not found.", 404);
  }

  return { message: "Tool updated." };
}
