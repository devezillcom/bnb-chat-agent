import type {
  CompleteFacebookConnectValues,
  ConnectionFormValues,
  UpdateConnectionValues,
} from "./schema";

export type {
  CompleteFacebookConnectValues,
  ConnectionFormValues,
  UpdateConnectionValues,
};

export type ConnectionSortKey = "name" | "channelType" | "createdAt" | "updatedAt";
export type ConnectionSortDirection = "asc" | "desc";

export type FacebookConnectionAuthData = {
  access_token: string;
  refresh_token: string;
  expires_at: string;
};

export type FacebookConnectionMetadata = {
  external_id: string;
  page_url?: string;
  avatar_url?: string;
};

export type ConnectionAgentSummary = {
  id: string;
  name: string;
};

export type ConnectionListItem = {
  id: string;
  channelType: string;
  name: string;
  metadata: Record<string, unknown> | null;
  lastError: string | null;
  agent: ConnectionAgentSummary | null;
  createdAt: string;
  updatedAt: string;
};

export type ListConnectionsParams = {
  workspaceId: string;
  keyword?: string;
  limit: number;
  offset: number;
  sortKey: ConnectionSortKey;
  sortDirection: ConnectionSortDirection;
};

export type ListConnectionsResult = {
  items: ConnectionListItem[];
  nextOffset: number | null;
  total: number;
};

export type GetConnectionParams = {
  id: string;
  workspaceId: string;
};

export type ConnectionDetail = ConnectionListItem;

export type UpdateConnectionParams = {
  id: string;
  workspaceId: string;
  name?: string;
  agentId?: string | null;
};

export type DeleteConnectionParams = {
  id: string;
  workspaceId: string;
};

export type RefreshConnectionConnectParams = {
  id: string;
  workspaceId: string;
  userId: string;
};

export type SyncConnectionScheduleParams = {
  connectionId: string;
  workspaceId: string;
  userId: string;
};

export type ConnectionMutationResult = {
  id: string;
  message: string;
};

export type CompleteFacebookConnectionConnectResult = {
  message: string;
  connectedCount: number;
  skippedCount: number;
  connectionIds: string[];
};

export type FacebookOAuthStateData = {
  state: string;
  userId: string;
  workspaceId: string;
  workspaceIndex: number;
};

export type FacebookPendingOAuthData = {
  userId: string;
  workspaceId: string;
  userAccessToken: string;
  userTokenExpiresAt: string;
};

export type FacebookPendingPage = {
  id: string;
  name: string;
  accessToken: string;
  pictureUrl: string | null;
  pageUrl: string | null;
};

export type FacebookPageOption = {
  id: string;
  name: string;
  pictureUrl: string | null;
  pageUrl: string | null;
};

export type ListConnectionsForAgentParams = {
  agentId: string;
  workspaceId: string;
};

export type ListConnectionsForAgentResult = {
  items: ConnectionListItem[];
};
