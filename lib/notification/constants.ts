export const NOTIFICATION_JOBS_PATH = "jobs";

export const NOTIFICATION_SEND_PATH = "channel-notifications";

export function getWorkspaceNotificationChannel(workspaceId: string): string {
  return `workspaces/${workspaceId}`;
}

export function getAgentNotificationChannel(agentId: string): string {
  return `agents/${agentId}`;
}
