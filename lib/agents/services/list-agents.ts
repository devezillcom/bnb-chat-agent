import { and, asc, count, desc, eq, ilike, or } from "drizzle-orm";

import { agents } from "@/db/schema";
import { db } from "@/lib/db";
import { parseChatModel } from "@/lib/langchain/models/registry";

import type { ListAgentsParams, ListAgentsResult } from "../types";

export async function listAgents(
  params: ListAgentsParams,
): Promise<ListAgentsResult> {
  const keyword = params.keyword?.trim();
  const sortKey = params.sortKey ?? "createdAt";
  const sortDirection = params.sortDirection ?? "desc";

  const conditions = [eq(agents.workspaceId, params.workspaceId)];

  if (keyword) {
    conditions.push(
      or(
        ilike(agents.name, `%${keyword}%`),
        ilike(agents.description, `%${keyword}%`),
      )!,
    );
  }

  const whereClause = and(...conditions);

  const [{ total }] = await db
    .select({ total: count() })
    .from(agents)
    .where(whereClause);

  const orderBy =
    sortKey === "name"
      ? sortDirection === "asc"
        ? [asc(agents.name), asc(agents.id)]
        : [desc(agents.name), desc(agents.id)]
      : sortDirection === "asc"
        ? [asc(agents.createdAt), asc(agents.id)]
        : [desc(agents.createdAt), desc(agents.id)];

  const rows = await db
    .select({
      id: agents.id,
      name: agents.name,
      description: agents.description,
      systemPrompt: agents.systemPrompt,
      model: agents.model,
      firstMessage: agents.firstMessage,
      createdAt: agents.createdAt,
      updatedAt: agents.updatedAt,
    })
    .from(agents)
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
      description: row.description,
      systemPrompt: row.systemPrompt,
      model: parseChatModel(row.model),
      firstMessage: row.firstMessage,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    })),
    nextOffset,
    total,
  };
}
