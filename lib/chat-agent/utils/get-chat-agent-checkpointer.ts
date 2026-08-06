import type { BaseCheckpointSaver } from "@langchain/langgraph-checkpoint";
import { MemorySaver } from "@langchain/langgraph-checkpoint";
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";

let checkpointerPromise: Promise<BaseCheckpointSaver> | null = null;

async function createCheckpointer(): Promise<BaseCheckpointSaver> {
  const databaseUrl = process.env.DATABASE_URL?.trim();

  if (databaseUrl) {
    const checkpointer = PostgresSaver.fromConnString(databaseUrl);
    await checkpointer.setup();
    return checkpointer;
  }

  return new MemorySaver();
}

export function getChatAgentCheckpointer(): Promise<BaseCheckpointSaver> {
  if (!checkpointerPromise) {
    checkpointerPromise = createCheckpointer();
  }

  return checkpointerPromise;
}
