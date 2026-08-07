import { agents, connections } from "@/db/schema";
import { db } from "@/lib/db";
import { and, asc, count, desc, eq, ilike, type SQL } from "drizzle-orm";

import type {
  ConnectionSortKey,
  ListConnectionsParams,
  ListConnectionsResult,
} from "../types";
import { mapConnectionRow } from "../utils/map-connection-row";

function getOrderExpression(sortKey: ConnectionSortKey) {
  switch (sortKey) {
    case "name":
      return connections.name;
    case "channelType":
      return connections.channelType;
    case "createdAt":
      return connections.createdAt;
    case "updatedAt":
      return connections.updatedAt;
  }
}

export async function listConnections(
  params: ListConnectionsParams,
): Promise<ListConnectionsResult> {
  const keyword = params.keyword?.trim();
  const conditions: SQL[] = [eq(connections.workspaceId, params.workspaceId)];

  if (keyword) {
    conditions.push(ilike(connections.name, `%${keyword}%`));
  }

  const whereClause = and(...conditions);
  const orderExpression = getOrderExpression(params.sortKey);
  const orderBy =
    params.sortDirection === "desc"
      ? desc(orderExpression)
      : asc(orderExpression);

  const [rows, totalRows] = await Promise.all([
    db
      .select({
        id: connections.id,
        channelType: connections.channelType,
        name: connections.name,
        metadata: connections.metadata,
        lastError: connections.lastError,
        createdAt: connections.createdAt,
        updatedAt: connections.updatedAt,
        agentId: connections.agentId,
        agentName: agents.name,
      })
      .from(connections)
      .leftJoin(agents, eq(connections.agentId, agents.id))
      .where(whereClause)
      .orderBy(orderBy, asc(connections.id))
      .limit(params.limit + 1)
      .offset(params.offset),
    db.select({ total: count() }).from(connections).where(whereClause),
  ]);

  const items = rows.slice(0, params.limit).map((row) => mapConnectionRow(row));

  return {
    items,
    nextOffset:
      rows.length > params.limit ? params.offset + params.limit : null,
    total: totalRows[0]?.total ?? 0,
  };
}
