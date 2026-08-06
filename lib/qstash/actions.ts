"use server";

import { getSession } from "@/lib/auth";
import { createServerAction } from "@/lib/exposers/create-server-action";
import { APIError } from "@/lib/exposers/api-error";

import { addJob, createSchedule, deleteSchedule } from "./services";
import type {
  AddJobParams,
  AddJobResult,
  ScheduleJobParams,
  ScheduleJobResult,
} from "./types";
import type { DeleteScheduleParams, DeleteScheduleResult } from "./services/delete-schedule-service";

export const addJobAction = createServerAction<
  (params: Omit<AddJobParams, "userId">) => Promise<AddJobResult>
>(async (params) => {
  const session = await getSession();

  if (!session) {
    throw new APIError("UNAUTHORIZED", "Unauthorized", 401);
  }

  return addJob({ ...params, userId: session.id });
}, { allowedRoles: ["user", "admin"] });

export const createScheduleAction = createServerAction<
  (params: Omit<ScheduleJobParams, "userId">) => Promise<ScheduleJobResult>
>(async (params) => {
  const session = await getSession();

  if (!session) {
    throw new APIError("UNAUTHORIZED", "Unauthorized", 401);
  }

  return createSchedule({ ...params, userId: session.id });
}, { allowedRoles: ["user", "admin"] });

export const deleteScheduleAction = createServerAction<
  (params: DeleteScheduleParams) => Promise<DeleteScheduleResult>
>(deleteSchedule, { allowedRoles: ["user", "admin"] });
