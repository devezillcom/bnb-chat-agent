import { Redis } from "@upstash/redis";

let client: Redis | null = null;

export function getRedisClient(): Redis {
  if (!client) {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url) {
      throw new Error("UPSTASH_REDIS_REST_URL environment variable is not set");
    }

    if (!token) {
      throw new Error(
        "UPSTASH_REDIS_REST_TOKEN environment variable is not set",
      );
    }

    client = new Redis({ url, token });
  }

  return client;
}

export function isRedisConfigured(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL?.trim() &&
      process.env.UPSTASH_REDIS_REST_TOKEN?.trim(),
  );
}
