import { and, eq } from "drizzle-orm";

import { tools } from "@/db/schema";
import { db } from "@/lib/db";
import { APIError } from "@/lib/exposers/api-error";

import type { GetToolParams, GetToolResult } from "../types";
import type { ToolHandlerType } from "../tool-handler-registry";

export async function getTool(params: GetToolParams): Promise<GetToolResult> {
  const [tool] = await db
    .select({
      id: tools.id,
      name: tools.name,
      handlerKey: tools.handlerKey,
      handlerType: tools.handlerType,
      description: tools.description,
      config: tools.config,
      locked: tools.locked,
      createdAt: tools.createdAt,
      updatedAt: tools.updatedAt,
    })
    .from(tools)
    .where(
      and(eq(tools.id, params.toolId), eq(tools.workspaceId, params.workspaceId)),
    )
    .limit(1);

  if (!tool) {
    throw new APIError("ERR_TOOL_NOT_FOUND", "Tool not found.", 404);
  }

  if (tool.locked) {
    throw new APIError(
      "ERR_TOOL_LOCKED",
      "This tool is locked and cannot be viewed.",
      403,
    );
  }

  return {
    id: tool.id,
    name: tool.name,
    handlerKey: tool.handlerKey,
    handlerType: tool.handlerType as ToolHandlerType,
    description: tool.description,
    config: tool.config,
    locked: tool.locked,
    createdAt: tool.createdAt.toISOString(),
    updatedAt: tool.updatedAt.toISOString(),
  };
}
