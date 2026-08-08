import { and, eq, ne } from "drizzle-orm";

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
      toolKey: tools.toolKey,
      registryToolId: tools.registryToolId,
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
  const toolKey = params.toolKey.trim();
  const registryToolId = params.registryToolId.trim();

  if (toolKey !== existing.toolKey) {
    const [duplicate] = await db
      .select({ id: tools.id })
      .from(tools)
      .where(
        and(
          eq(tools.workspaceId, params.workspaceId),
          eq(tools.toolKey, toolKey),
          ne(tools.id, params.toolId),
        ),
      )
      .limit(1);

    if (duplicate) {
      throw new APIError(
        "ERR_TOOL_KEY_EXISTS",
        "A tool with this tool key already exists in the workspace.",
        409,
      );
    }
  }

  if (registryToolId !== existing.registryToolId) {
    throw new APIError(
      "ERR_TOOL_REGISTRY_ID_IMMUTABLE",
      "Registry tool cannot be changed after creation.",
      400,
    );
  }

  let config: Record<string, string>;

  try {
    config = normalizeToolConfig(registryToolId, params.config);
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
      toolKey,
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
