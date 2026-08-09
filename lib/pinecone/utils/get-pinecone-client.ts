import "server-only";

import { Pinecone } from "@pinecone-database/pinecone";

export function isPineconeConfigured(): boolean {
  return Boolean(
    process.env.PINECONE_API_KEY?.trim() &&
      process.env.PINECONE_INDEX_NAME?.trim(),
  );
}

export function getPineconeClient(): Pinecone {
  const apiKey = process.env.PINECONE_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("PINECONE_API_KEY is not configured.");
  }

  return new Pinecone({ apiKey });
}

export async function getPineconeIntegratedIndex(namespace: string) {
  const indexName = process.env.PINECONE_INDEX_NAME?.trim();
  if (!indexName) {
    throw new Error("PINECONE_INDEX_NAME is not configured.");
  }

  const client = getPineconeClient();
  const description = await client.describeIndex(indexName);

  if (!description.host) {
    throw new Error(`Pinecone index "${indexName}" has no host.`);
  }

  return client.index({ host: description.host, namespace });
}
