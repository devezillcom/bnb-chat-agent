import { getAdminDatabase } from "@/lib/firebase/admin";
import { APIError } from "@/lib/exposers/api-error";

import { NOTIFICATION_JOBS_PATH } from "../constants";
import type {
  CreateJobStatusTrackingParams,
  CreateJobStatusTrackingResult,
  JobRecord,
} from "../types";
import { parseRtdbPathKey } from "../utils/parse-rtdb-path-key";

export async function createJobStatusTracking<
  T extends Record<string, unknown>,
>(params: CreateJobStatusTrackingParams<T>): Promise<CreateJobStatusTrackingResult> {
  const db = getAdminDatabase();
  if (!db) {
    throw new APIError(
      "ERR_NOT_CONFIGURED",
      "Firebase Realtime Database is not configured",
      503,
    );
  }

  const jobKey = parseRtdbPathKey(params.jobKey);
  const status = params.status ?? "pending";
  const now = Date.now();
  const row: JobRecord<T> = {
    status,
    payload: params.payload,
    createdAt: now,
    updatedAt: now,
  };

  const jobRef = db.ref(`${NOTIFICATION_JOBS_PATH}/${jobKey}`);
  const snap = await jobRef.once("value");
  if (snap.exists()) {
    throw new APIError(
      "ERR_JOB_EXISTS",
      "A job with this key already exists",
      409,
    );
  }

  await jobRef.set(row);
  return { jobKey };
}
