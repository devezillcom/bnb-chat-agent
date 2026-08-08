import { and, eq } from "drizzle-orm";

import { tools } from "@/db/schema";
import { db } from "@/lib/db";
import { APIError } from "@/lib/exposers/api-error";

import type { DeleteToolParams, DeleteToolResult } from "../types";

export async function deleteTool(
  params: DeleteToolParams,
): Promise<DeleteToolResult> {
  const [existing] = await db
    .select({ id: tools.id, locked: tools.locked })
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
      "This tool is locked and cannot be deleted.",
      403,
    );
  }

  const deleted = await db
    .delete(tools)
    .where(
      and(eq(tools.id, params.toolId), eq(tools.workspaceId, params.workspaceId)),
    )
    .returning({ id: tools.id });

  if (deleted.length === 0) {
    throw new APIError("ERR_TOOL_NOT_FOUND", "Tool not found.", 404);
  }

  return { message: "Tool deleted." };
}
