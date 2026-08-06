import { z } from "zod";

export const qstashJobEnvelopeSchema = z.object({
  jobName: z.string().min(1, "jobName is required"),
  payload: z.unknown().optional(),
  userId: z.string().optional(),
});

export type QstashJobEnvelope = z.infer<typeof qstashJobEnvelopeSchema>;

export const addJobRequestSchema = z.object({
  jobName: z.string().min(1, "jobName is required"),
  payload: z.unknown().optional(),
  delay: z.number().optional(),
  flowControl: z
    .object({
      key: z.string().min(1, "flowControl.key is required"),
      parallelism: z.number().optional(),
      ratePerSecond: z.number().optional(),
      rate: z.number().optional(),
      period: z.union([z.string(), z.number()]).optional(),
    })
    .optional(),
});

export const scheduleJobRequestSchema = z.object({
  jobName: z.string().min(1, "jobName is required"),
  payload: z.unknown().optional(),
  cron: z.string().min(1, "cron is required"),
  scheduleId: z.string().optional(),
});
