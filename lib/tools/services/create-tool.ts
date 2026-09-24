import { tools } from "@/db/schema";
import { db } from "@/lib/db";
import { APIError } from "@/lib/exposers/api-error";

import type { CreateToolParams, CreateToolResult } from "../types";
import { normalizeToolConfig } from "../utils/normalize-tool-config";

export async function createTool(
  params: CreateToolParams,
): Promise<CreateToolResult> {
  const trimmedName = params.name.trim();
  const registryToolId = params.registryToolId.trim();

  let config: Record<string, unknown>;

  try {
    config = normalizeToolConfig(registryToolId, params.config);
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
      registryToolId,
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
