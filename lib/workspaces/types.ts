import type { WorkspacePermission } from "./constants";

export type { WorkspacePermission };

export type WorkspaceContext = {
  userId: string;
  workspaceId: string;
  permission: WorkspacePermission;
  role?: string;
};

export type WorkspaceListItem = {
  id: string;
  name: string;
  slug: string | null;
  ownerUserId: string;
  permission: WorkspacePermission;
  createdAt: string;
  updatedAt: string;
};

export type ListWorkspacesForUserParams = {
  userId: string;
};

export type ListWorkspacesForUserResult = {
  items: WorkspaceListItem[];
};

export type CreateWorkspaceParams = {
  userId: string;
  name: string;
  slug?: string;
};

export type CreateWorkspaceResult = {
  id: string;
  name: string;
  slug: string | null;
  message: string;
};

export type DeleteWorkspaceParams = {
  userId: string;
  workspaceId: string;
};

export type DeleteWorkspaceResult = {
  message: string;
};
