import "server-only";

import { and, eq, inArray } from "drizzle-orm";

import { tools } from "@/db/schema";
import { db } from "@/lib/db";

import type { ToolRegistryId } from "../tool-registry";
import { getToolDefinition } from "../tool-registry";
import type {
  ListToolsBySlugsParams,
  ListToolsBySlugsResult,
} from "../types";

export async function listToolsBySlugs(
  params: ListToolsBySlugsParams,
): Promise<ListToolsBySlugsResult> {
  const slugs = [...new Set(params.slugs.map((slug) => slug.trim()).filter(Boolean))];

  if (slugs.length === 0) {
    return [];
  }

  const rows = await db
    .select({
      name: tools.name,
      slug: tools.slug,
      registryToolId: tools.registryToolId,
      description: tools.description,
      config: tools.config,
    })
    .from(tools)
    .where(
      and(
        eq(tools.workspaceId, params.workspaceId),
        inArray(tools.slug, slugs),
      ),
    );

  const results: ListToolsBySlugsResult = [];

  for (const row of rows) {
    const definition = getToolDefinition(row.registryToolId);
    if (!definition) {
      continue;
    }

    results.push({
      slug: row.slug,
      name: row.name,
      description: row.description?.trim() || definition.description,
      registryToolId: row.registryToolId as ToolRegistryId,
      config: row.config,
    });
  }

  return results;
}
