import { and, eq } from "drizzle-orm";

import { connections } from "@/db/schema";
import { db } from "@/lib/db";
import { APIError } from "@/lib/exposers/api-error";
import { createSchedule } from "@/lib/qstash/services/create-schedule-service";
import { deleteSchedule } from "@/lib/qstash/services/delete-schedule-service";
import { getSchedule } from "@/lib/qstash/services/get-schedule-service";
import { buildQstashCron } from "@/lib/qstash/utils/build-qstash-cron";
import { getCallbackUrl } from "@/lib/qstash/utils/get-callback-url";

import {
  DEFAULT_CONNECTION_REFRESH_CRON_CONFIG,
  REFRESH_CONNECTION_CONNECT_QSTASH_JOB_NAME,
} from "../constants";
import type { SyncConnectionScheduleParams } from "../types";
import { getConnectionScheduleId } from "../utils/connection-display-utils";

function isScheduleUpToDate(
  existingSchedule: NonNullable<Awaited<ReturnType<typeof getSchedule>>>,
  expected: {
    cron: string;
    destination: string;
  },
): boolean {
  return (
    existingSchedule.cron === expected.cron &&
    existingSchedule.destination === expected.destination
  );
}

function isRefreshScheduleSupported(channelType: string) {
  return channelType === "facebook";
}

export async function syncConnectionSchedule(
  params: SyncConnectionScheduleParams,
): Promise<void> {
  if (process.env.NODE_ENV !== "production") {
    console.log(
      "Skipping sync connection schedule in non-production environment",
      params,
    );
    return;
  }

  const [row] = await db
    .select({
      channelType: connections.channelType,
      lastError: connections.lastError,
    })
    .from(connections)
    .where(
      and(
        eq(connections.id, params.connectionId),
        eq(connections.workspaceId, params.workspaceId),
      ),
    )
    .limit(1);

  if (!row) {
    throw new APIError("ERR_CONNECTION_NOT_FOUND", "Connection not found.", 404);
  }

  const scheduleId = getConnectionScheduleId(params.connectionId);
  const qstashCron = buildQstashCron(DEFAULT_CONNECTION_REFRESH_CRON_CONFIG);
  const shouldSchedule =
    row.lastError === null &&
    isRefreshScheduleSupported(row.channelType) &&
    qstashCron !== null;

  const existingSchedule = await getSchedule({ scheduleId });

  if (!shouldSchedule) {
    if (existingSchedule) {
      await deleteSchedule({ scheduleId });
    }

    return;
  }

  const expectedSchedule = {
    cron: qstashCron,
    destination: getCallbackUrl(),
  };

  if (
    existingSchedule &&
    isScheduleUpToDate(existingSchedule, expectedSchedule)
  ) {
    return;
  }

  if (existingSchedule) {
    await deleteSchedule({ scheduleId });
  }

  try {
    await createSchedule({
      userId: params.userId,
      jobName: REFRESH_CONNECTION_CONNECT_QSTASH_JOB_NAME,
      payload: { connectionId: params.connectionId },
      cron: qstashCron,
      scheduleId,
    });
  } catch (error) {
    console.error(error);
    throw new APIError(
      "ERR_CONNECTION_SCHEDULE_SYNC_FAILED",
      "Could not sync connection refresh schedule.",
      502,
    );
  }
}

export async function deleteConnectionSchedule(connectionId: string): Promise<void> {
  if (process.env.NODE_ENV !== "production") {
    return;
  }

  await deleteSchedule({ scheduleId: getConnectionScheduleId(connectionId) });
}
