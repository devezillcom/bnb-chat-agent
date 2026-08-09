import "server-only";

import { and, asc, count, desc, eq, ilike, or, sql } from "drizzle-orm";

import { knowledgeBaseDocuments, knowledgeBases } from "@/db/schema";
import { db } from "@/lib/db";

import type { ListKnowledgeBasesParams, ListKnowledgeBasesResult } from "../types";

export async function listKnowledgeBases(
  params: ListKnowledgeBasesParams,
): Promise<ListKnowledgeBasesResult> {
  const keyword = params.keyword?.trim();
  const sortKey = params.sortKey ?? "createdAt";
  const sortDirection = params.sortDirection ?? "desc";
  const conditions = [eq(knowledgeBases.workspaceId, params.workspaceId)];

  if (keyword) {
    conditions.push(
      or(
        ilike(knowledgeBases.name, `%${keyword}%`),
        ilike(knowledgeBases.description, `%${keyword}%`),
        ilike(knowledgeBases.slug, `%${keyword}%`),
      )!,
    );
  }

  const whereClause = and(...conditions);

  const [{ total }] = await db
    .select({ total: count() })
    .from(knowledgeBases)
    .where(whereClause);

  const orderBy =
    sortKey === "name"
      ? sortDirection === "asc"
        ? [asc(knowledgeBases.name), asc(knowledgeBases.id)]
        : [desc(knowledgeBases.name), desc(knowledgeBases.id)]
      : sortDirection === "asc"
        ? [asc(knowledgeBases.createdAt), asc(knowledgeBases.id)]
        : [desc(knowledgeBases.createdAt), desc(knowledgeBases.id)];

  const rows = await db
    .select({
      id: knowledgeBases.id,
      name: knowledgeBases.name,
      slug: knowledgeBases.slug,
      description: knowledgeBases.description,
      createdAt: knowledgeBases.createdAt,
      updatedAt: knowledgeBases.updatedAt,
      documentCount: sql<number>`coalesce(count(${knowledgeBaseDocuments.id}), 0)::int`,
    })
    .from(knowledgeBases)
    .leftJoin(
      knowledgeBaseDocuments,
      eq(knowledgeBaseDocuments.knowledgeBaseId, knowledgeBases.id),
    )
    .where(whereClause)
    .groupBy(knowledgeBases.id)
    .orderBy(...orderBy)
    .limit(params.limit)
    .offset(params.offset);

  const nextOffset =
    params.offset + rows.length < total ? params.offset + rows.length : null;

  return {
    items: rows.map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      documentCount: row.documentCount,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    })),
    total,
    nextOffset,
  };
}
