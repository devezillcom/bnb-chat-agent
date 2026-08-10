import { eq } from "drizzle-orm";

import { chatAgentSessions } from "@/db/schema";
import { db } from "@/lib/db";

export async function deleteConnectionConversations(params: {
  connectionId: string;
}): Promise<void> {
  await db
    .delete(chatAgentSessions)
    .where(eq(chatAgentSessions.connectionId, params.connectionId));
}
