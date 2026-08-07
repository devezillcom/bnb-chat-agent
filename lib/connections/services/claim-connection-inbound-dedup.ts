import { connectionInboundDedup } from "@/db/schema";
import { db } from "@/lib/db";

export async function claimConnectionInboundDedup(params: {
  connectionId: string;
  externalMessageId: string;
}): Promise<boolean> {
  const result = await db
    .insert(connectionInboundDedup)
    .values({
      connectionId: params.connectionId,
      externalMessageId: params.externalMessageId,
    })
    .onConflictDoNothing()
    .returning({ id: connectionInboundDedup.id });

  return result.length > 0;
}
