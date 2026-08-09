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
  const slug = params.slug.trim();
  const registryToolId = params.registryToolId.trim();

  const [existing] = await db
    .select({ id: tools.id })
    .from(tools)
    .where(
      and(
        eq(tools.workspaceId, params.workspaceId),
        eq(tools.slug, slug),
      ),
    )
    .limit(1);

  if (existing) {
    throw new APIError(
      "ERR_TOOL_SLUG_EXISTS",
      "A tool with this slug already exists in the workspace.",
      409,
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

  const [tool] = await db
    .insert(tools)
    .values({
      workspaceId: params.workspaceId,
      name: trimmedName,
      slug,
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
