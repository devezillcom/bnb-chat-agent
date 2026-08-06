import { randomUUID } from "node:crypto";

import { getRedisClient } from "./get-redis-client";

const DEFAULT_LOCK_TTL_SECONDS = 60;
const DEFAULT_WAIT_TIMEOUT_MS = 30_000;
const DEFAULT_WAIT_POLL_INTERVAL_MS = 500;

/** Small fixed buffer for REST latency and clock skew (seconds). */
const READY_EVENT_KEY_TTL_SLACK_SECONDS = 5;

export type CreateOnDemandServiceParams<TParams, TResult> = {
  // Return null if no result exists.
  getExistingResult: (params: TParams) => Promise<TResult | null | undefined>;

  runTask: (params: TParams) => Promise<TResult>;

  /** Stable id for this request (lock + ready coordination). Must be unique per logical job. */
  getId: (params: TParams) => string;

  keyPrefix?: string;
  lockTtlSeconds?: number;
  waitTimeoutMs?: number;
  waitPollIntervalMs?: number;
};

/**
 * TTL for `:ready` so the key outlives the slowest waiter and the lock-bound critical
 * section; refreshed on every `incr`. Derived only from wait/lock/poll settings.
 */
function computeSafeReadyEventKeyTtlSeconds(options: {
  waitTimeoutMs: number;
  lockTtlSeconds: number;
  waitPollIntervalMs: number;
}): number {
  const waitSeconds = Math.ceil(options.waitTimeoutMs / 1000);
  const pollSeconds = Math.max(
    1,
    Math.ceil(options.waitPollIntervalMs / 1000)
  );

  return (
    waitSeconds +
    options.lockTtlSeconds +
    pollSeconds +
    READY_EVENT_KEY_TTL_SLACK_SECONDS
  );
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Create an on-demand service handler with request deduplication.
 *
 * Returned handler flow per call:
 * 1) Try `getExistingResult`.
 * 2) If missing, try acquiring a redis lock derived from `getId(params)`.
 * 3) If lock acquired, run `runTask`, release lock, and publish a ready signal.
 * 4) If lock not acquired, wait for the ready signal and read existing result again.
 *
 * The `:ready` key uses a TTL so idle ids do not grow Redis memory forever.
 */
export function createOnDemandServiceHandler<TParams, TResult>(
  options: CreateOnDemandServiceParams<TParams, TResult>
) {
  return async function onDemandServiceHandler(
    params: TParams
  ): Promise<TResult> {
    const existingResult = await options.getExistingResult(params);
    if (existingResult != null) {
      return existingResult;
    }

    const redis = getRedisClient();
    // Keep the legacy default prefix to avoid breaking Redis coordination on deploy.
    const keyPrefix = options.keyPrefix ?? "on-demand-task";
    const lockTtlSeconds = options.lockTtlSeconds ?? DEFAULT_LOCK_TTL_SECONDS;
    const waitTimeoutMs = options.waitTimeoutMs ?? DEFAULT_WAIT_TIMEOUT_MS;
    const waitPollIntervalMs =
      options.waitPollIntervalMs ?? DEFAULT_WAIT_POLL_INTERVAL_MS;
    const readyEventKeyTtlSeconds = computeSafeReadyEventKeyTtlSeconds({
      waitTimeoutMs,
      lockTtlSeconds,
      waitPollIntervalMs,
    });

    const id = options.getId(params);
    const lockKey = `${keyPrefix}:${id}:lock`;
    const readyEventKey = `${keyPrefix}:${id}:ready`;
    const lockOwner = randomUUID();
    const readyVersionBefore = Number((await redis.get(readyEventKey)) ?? 0);

    const lockAcquired = await redis.set(lockKey, lockOwner, {
      nx: true,
      ex: lockTtlSeconds,
    });

    if (lockAcquired) {
      try {
        return await options.runTask(params);
      } finally {
        const currentLockOwner = await redis.get(lockKey);

        if (currentLockOwner === lockOwner) {
          await redis.del(lockKey);
        }

        // Incrementing this key acts as a simple "ready" event signal.
        await redis.incr(readyEventKey);
        await redis.expire(readyEventKey, readyEventKeyTtlSeconds);
      }
    }

    const waitUntil = Date.now() + waitTimeoutMs;

    while (Date.now() < waitUntil) {
      const currentReadyVersion = Number(
        (await redis.get(readyEventKey)) ?? 0
      );

      if (currentReadyVersion > readyVersionBefore) {
        break;
      }

      await sleep(waitPollIntervalMs);
    }

    const resultAfterWait = await options.getExistingResult(params);

    if (resultAfterWait != null) {
      return resultAfterWait;
    }

    throw new Error(
      "On-demand service error or timed out while waiting."
    );
  };
}

/**
 * Backwards-compatible exports.
 * Keep these while older imports are being migrated.
 */
export type CreateOnDemandTaskParams<TParams, TResult> =
  CreateOnDemandServiceParams<TParams, TResult>;

export function createOnDemandTaskHandler<TParams, TResult>(
  options: CreateOnDemandTaskParams<TParams, TResult>
) {
  return createOnDemandServiceHandler(options);
}

