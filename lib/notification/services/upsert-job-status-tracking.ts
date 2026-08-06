import { getAdminDatabase } from "@/lib/firebase/admin";

import { NOTIFICATION_JOBS_PATH } from "../constants";
import type {
  JobRecord,
  UpsertJobStatusTrackingParams,
  UpsertJobStatusTrackingResult,
} from "../types";
import { parseRtdbPathKey } from "../utils/parse-rtdb-path-key";

export async function upsertJobStatusTracking<
  T extends Record<string, unknown> = Record<string, unknown>,
>(
  params: UpsertJobStatusTrackingParams<T>,
): Promise<UpsertJobStatusTrackingResult | null> {
  const adminDb = getAdminDatabase();
  if (!adminDb) {
    return null;
  }

  const key = parseRtdbPathKey(params.jobKey);
  const ref = adminDb.ref(`${NOTIFICATION_JOBS_PATH}/${key}`);
  const snap = await ref.once("value");
  const now = Date.now();
  const status = params.status ?? "pending";

  if (!snap.exists()) {
    const row: JobRecord<T> = {
      status,
      payload: params.payload,
      error: params.error ?? null,
      createdAt: now,
      updatedAt: now,
    };
    await ref.set(row);
    return { jobKey: params.jobKey };
  }

  const prev = snap.val() as JobRecord<T>;
  const nextError =
    params.error !== undefined
      ? params.error
      : status === "succeeded"
        ? null
        : (prev.error ?? null);

  await ref.update({
    status,
    payload: params.payload,
    error: nextError,
    updatedAt: now,
  });

  return { jobKey: params.jobKey };
}
