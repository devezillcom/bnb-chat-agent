export const CONNECTION_TYPES = {
  facebook: {
    label: "Facebook",
    connectPath: "/connections/connect/facebook",
  },
} as const;

export type ConnectionType = keyof typeof CONNECTION_TYPES;

export const FACEBOOK_OAUTH_SCOPES = [
  "pages_messaging",
  "pages_manage_metadata",
  "pages_show_list",
  "public_profile",
] as const;

export const FACEBOOK_GRAPH_VERSION = "v21.0";

export const FACEBOOK_GRAPH_BASE = `https://graph.facebook.com/${FACEBOOK_GRAPH_VERSION}`;

export const FACEBOOK_OAUTH_DIALOG_URL = `https://www.facebook.com/${FACEBOOK_GRAPH_VERSION}/dialog/oauth`;

export const FACEBOOK_OAUTH_STATE_COOKIE = "facebook_oauth_state";

export const FACEBOOK_PENDING_OAUTH_COOKIE = "facebook_connection_connect_pending";

export const FACEBOOK_OAUTH_COOKIE_MAX_AGE_SECONDS = 15 * 60;

export const REFRESH_CONNECTION_CONNECT_QSTASH_JOB_NAME =
  "refresh-connection-connect";

export const FACEBOOK_LONG_LIVED_TOKEN_REFRESH_WITHIN_MS =
  14 * 24 * 60 * 60 * 1000;

export const DEFAULT_CONNECTION_REFRESH_CRON_CONFIG = {
  cron: "0 9 * * 0",
  timezone: "UTC",
} as const;

export const CONNECTION_NAME_MAX_LENGTH = 120;
