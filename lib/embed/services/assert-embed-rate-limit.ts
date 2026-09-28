import { APIError } from "@/lib/exposers/api-error";
import { getRedisClient, isRedisConfigured } from "@/lib/redis/utils/get-redis-client";

import { EMBED_RATE_LIMIT_WINDOW_SECONDS } from "../constants";

export async function assertEmbedRateLimit(params: {
  key: string;
  limit: number;
}) {
  if (!isRedisConfigured()) {
    return;
  }

  const redis = getRedisClient();
  const count = Number(await redis.incr(params.key));

  if (count === 1) {
    await redis.expire(params.key, EMBED_RATE_LIMIT_WINDOW_SECONDS);
  }

  if (count > params.limit) {
    throw new APIError(
      "ERR_EMBED_RATE_LIMIT",
      "Too many requests. Try again shortly.",
      429,
    );
  }
}
