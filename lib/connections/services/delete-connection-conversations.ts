import { eq } from "drizzle-orm";

import { connectionConversations } from "@/db/schema";
import { db } from "@/lib/db";

export async function deleteConnectionConversations(params: {
  connectionId: string;
}): Promise<void> {
  await db
    .delete(connectionConversations)
    .where(eq(connectionConversations.connectionId, params.connectionId));
}
