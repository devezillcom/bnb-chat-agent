import { and, eq } from "drizzle-orm";

import { connections } from "@/db/schema";
import { db } from "@/lib/db";

import { deleteConnectionSchedule } from "./sync-connection-schedule";

export async function recordConnectionConnectFailure(params: {
  workspaceId: string;
  connectionId: string;
  errorMessage: string;
}): Promise<void> {
  await deleteConnectionSchedule(params.connectionId);

  await db
    .update(connections)
    .set({
      lastError: params.errorMessage.trim(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(connections.id, params.connectionId),
        eq(connections.workspaceId, params.workspaceId),
      ),
    );
}
