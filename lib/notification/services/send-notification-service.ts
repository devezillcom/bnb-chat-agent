import { getAdminDatabase } from "@/lib/firebase/admin";
import { APIError } from "@/lib/exposers/api-error";

import { NOTIFICATION_SEND_PATH } from "../constants";
import type {
  ChannelNotificationRecord,
  SendNotificationParams,
  SendNotificationResult,
} from "../types";
import { parseRtdbPath } from "../utils/parse-rtdb-path-key";

export async function sendNotification<T extends Record<string, unknown>>(
  params: SendNotificationParams<T>,
): Promise<SendNotificationResult> {
  const db = getAdminDatabase();
  if (!db) {
    throw new APIError(
      "ERR_NOT_CONFIGURED",
      "Firebase Realtime Database is not configured",
      503,
    );
  }

  const channelPath = parseRtdbPath(params.channelName);
  const ref = db.ref(`${NOTIFICATION_SEND_PATH}/${channelPath}`);

  const tx = await ref.transaction((current) => {
    const now = Date.now();
    if (current == null) {
      const row: ChannelNotificationRecord<T> = {
        payload: params.payload,
        createdAt: now,
        updatedAt: now,
      };
      return row;
    }

    const prev = current as Partial<ChannelNotificationRecord<T>>;
    const createdAt = typeof prev.createdAt === "number" ? prev.createdAt : now;
    const next: ChannelNotificationRecord<T> = {
      payload: params.payload,
      createdAt,
      updatedAt: now,
    };
    return next;
  });

  if (!tx.committed) {
    throw new APIError(
      "ERR_NOTIFICATION_SEND_FAILED",
      "Could not write notification",
      500,
    );
  }

  return { channelName: channelPath };
}
