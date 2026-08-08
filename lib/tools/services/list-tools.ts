import { and, asc, count, desc, eq, ilike, or } from "drizzle-orm";

import { tools } from "@/db/schema";
import { db } from "@/lib/db";

import type { ListToolsParams, ListToolsResult } from "../types";
import type { ToolRegistryId } from "../tool-registry";

export async function listTools(
  params: ListToolsParams,
): Promise<ListToolsResult> {
  const keyword = params.keyword?.trim();
  const sortKey = params.sortKey ?? "createdAt";
  const sortDirection = params.sortDirection ?? "desc";

  const conditions = [eq(tools.workspaceId, params.workspaceId)];

  if (keyword) {
    conditions.push(
      or(
        ilike(tools.name, `%${keyword}%`),
        ilike(tools.description, `%${keyword}%`),
        ilike(tools.toolKey, `%${keyword}%`),
        ilike(tools.registryToolId, `%${keyword}%`),
      )!,
    );
  }

  const whereClause = and(...conditions);

  const [{ total }] = await db
    .select({ total: count() })
    .from(tools)
    .where(whereClause);

  const orderBy =
    sortKey === "name"
      ? sortDirection === "asc"
        ? [asc(tools.name), asc(tools.id)]
        : [desc(tools.name), desc(tools.id)]
      : sortDirection === "asc"
        ? [asc(tools.createdAt), asc(tools.id)]
        : [desc(tools.createdAt), desc(tools.id)];

  const rows = await db
    .select({
      id: tools.id,
      name: tools.name,
      toolKey: tools.toolKey,
      registryToolId: tools.registryToolId,
      description: tools.description,
      locked: tools.locked,
      createdAt: tools.createdAt,
      updatedAt: tools.updatedAt,
    })
    .from(tools)
    .where(whereClause)
    .orderBy(...orderBy)
    .limit(params.limit)
    .offset(params.offset);

  const nextOffset =
    params.offset + rows.length < total ? params.offset + rows.length : null;

  return {
    items: rows.map((row) => ({
      id: row.id,
      name: row.name,
      toolKey: row.toolKey,
      registryToolId: row.registryToolId as ToolRegistryId,
      description: row.description,
      locked: row.locked,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    })),
    nextOffset,
    total,
  };
}
