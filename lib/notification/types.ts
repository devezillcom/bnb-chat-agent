export type JobStatus = "pending" | "running" | "succeeded" | "failed";

export type JobRecord<T extends Record<string, unknown> = Record<string, unknown>> = {
  status: JobStatus;
  payload: T;
  error?: string | null;
  createdAt: number;
  updatedAt: number;
};

export type CreateJobStatusTrackingParams<
  T extends Record<string, unknown> = Record<string, unknown>,
> = {
  jobKey: string;
  payload: T;
  status?: JobStatus;
};

export type CreateJobStatusTrackingResult = {
  jobKey: string;
};

export type UpsertJobStatusTrackingParams<
  T extends Record<string, unknown> = Record<string, unknown>,
> = {
  jobKey: string;
  payload: T;
  status?: JobStatus;
  error?: string | null;
};

export type UpsertJobStatusTrackingResult = {
  jobKey: string;
};

export type ChannelNotificationRecord<
  T extends Record<string, unknown> = Record<string, unknown>,
> = {
  payload: T;
  clientId?: string;
  createdAt: number;
  updatedAt: number;
};

export type SendNotificationParams<
  T extends Record<string, unknown> = Record<string, unknown>,
> = {
  channelName: string;
  payload: T;
};

export type SendNotificationResult = {
  channelName: string;
};

export type ChannelEventPayload<
  TEvent extends string,
  TData extends Record<string, unknown>,
> = {
  event: TEvent;
  data: TData;
};
