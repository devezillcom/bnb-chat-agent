import "server-only";

import { getAdminDatabase } from "@/lib/firebase/admin";
import { NOTIFICATION_JOBS_PATH } from "@/lib/notification/constants";
import type { JobRecord } from "@/lib/notification/types";
import { parseRtdbPathKey } from "@/lib/notification/utils/parse-rtdb-path-key";

import { BIENHINH_IMAGE_DELIVERY_JOB_KEY_PREFIX } from "../constants";

function buildDeliveryJobKey(requestId: string): string {
  return `${BIENHINH_IMAGE_DELIVERY_JOB_KEY_PREFIX}-${requestId}`;
}

export async function claimBienhinhImageDelivery(
  requestId: string,
): Promise<boolean> {
  const adminDb = getAdminDatabase();
  if (!adminDb) {
    return true;
  }

  const key = parseRtdbPathKey(buildDeliveryJobKey(requestId));
  const ref = adminDb.ref(`${NOTIFICATION_JOBS_PATH}/${key}`);

  const result = await ref.transaction((current) => {
    const existing = current as JobRecord | null;

    if (existing?.status === "succeeded") {
      return undefined;
    }

    const now = Date.now();

    return {
      status: "running",
      payload: { requestId },
      error: null,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    } satisfies JobRecord;
  });

  return result.committed;
}

export async function markBienhinhImageDeliverySucceeded(
  requestId: string,
): Promise<void> {
  const adminDb = getAdminDatabase();
  if (!adminDb) {
    return;
  }

  const key = parseRtdbPathKey(buildDeliveryJobKey(requestId));
  const ref = adminDb.ref(`${NOTIFICATION_JOBS_PATH}/${key}`);
  const now = Date.now();
  const snap = await ref.once("value");
  const existing = snap.val() as JobRecord | null;

  await ref.set({
    status: "succeeded",
    payload: { requestId },
    error: null,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  } satisfies JobRecord);
}

export async function markBienhinhImageDeliveryFailed(
  requestId: string,
  error: string,
): Promise<void> {
  const adminDb = getAdminDatabase();
  if (!adminDb) {
    return;
  }

  const key = parseRtdbPathKey(buildDeliveryJobKey(requestId));
  const ref = adminDb.ref(`${NOTIFICATION_JOBS_PATH}/${key}`);
  const now = Date.now();
  const snap = await ref.once("value");
  const existing = snap.val() as JobRecord | null;

  await ref.set({
    status: "failed",
    payload: { requestId },
    error,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  } satisfies JobRecord);
}
