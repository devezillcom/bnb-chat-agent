type CronScheduleValue = {
  cron: string;
  timezone: string;
};

function normalizeCronScheduleValue(
  raw: Record<string, unknown> | null | undefined,
): CronScheduleValue {
  const cron = typeof raw?.cron === "string" ? raw.cron.trim() : "";
  const timezone =
    typeof raw?.timezone === "string" && raw.timezone.trim()
      ? raw.timezone.trim()
      : "UTC";

  return { cron, timezone };
}

export function buildQstashCron(
  cronConfig: Record<string, unknown> | null | undefined,
): string | null {
  const { cron, timezone } = normalizeCronScheduleValue(cronConfig);
  const trimmedCron = cron.trim();

  if (!trimmedCron) {
    return null;
  }

  return `CRON_TZ=${timezone} ${trimmedCron}`;
}
