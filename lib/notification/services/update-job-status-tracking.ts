import { getAdminDatabase } from "@/lib/firebase/admin";

import { NOTIFICATION_JOBS_PATH } from "../constants";
import type { JobRecord, JobStatus } from "../types";
import { parseRtdbPathKey } from "../utils/parse-rtdb-path-key";

export async function updateJobStatusTracking<
  T extends Record<string, unknown> = Record<string, unknown>,
>(
  jobKey: string,
  updates: { status: JobStatus; error?: string | null; payload?: T },
): Promise<void> {
  const adminDb = getAdminDatabase();
  if (!adminDb) {
    return;
  }

  const key = parseRtdbPathKey(jobKey);
  const ref = adminDb.ref(`${NOTIFICATION_JOBS_PATH}/${key}`);
  const snap = await ref.once("value");
  if (!snap.exists()) {
    return;
  }

  const prev = snap.val() as JobRecord;
  const now = Date.now();
  const nextError =
    updates.status === "succeeded"
      ? null
      : updates.error !== undefined
        ? updates.error
        : (prev.error ?? null);

  await ref.update({
    status: updates.status,
    error: nextError,
    updatedAt: now,
    ...(updates.payload !== undefined ? { payload: updates.payload } : {}),
  });
}
