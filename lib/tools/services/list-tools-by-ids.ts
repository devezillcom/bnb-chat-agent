import "server-only";

import { and, eq, inArray } from "drizzle-orm";

import { tools } from "@/db/schema";
import { db } from "@/lib/db";

import type { ToolRegistryId } from "../tool-registry";
import { getToolDefinition } from "../tool-registry";
import type { ListToolsByIdsParams, ListToolsByIdsResult } from "../types";

export async function listToolsByIds(
  params: ListToolsByIdsParams,
): Promise<ListToolsByIdsResult> {
  const toolIds = [...new Set(params.toolIds)];

  if (toolIds.length === 0) {
    return [];
  }

  const rows = await db
    .select({
      id: tools.id,
      name: tools.name,
      registryToolId: tools.registryToolId,
      description: tools.description,
      config: tools.config,
    })
    .from(tools)
    .where(
      and(
        eq(tools.workspaceId, params.workspaceId),
        inArray(tools.id, toolIds),
      ),
    );

  const results: ListToolsByIdsResult = [];

  for (const row of rows) {
    const definition = getToolDefinition(row.registryToolId);
    if (!definition) {
      continue;
    }

    results.push({
      id: row.id,
      name: row.name,
      description: row.description?.trim() || definition.description,
      registryToolId: row.registryToolId as ToolRegistryId,
      config: row.config,
    });
  }

  return results;
}
