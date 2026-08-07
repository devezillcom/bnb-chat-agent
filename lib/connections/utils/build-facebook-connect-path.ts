import { getDashboardNavHref } from "@/lib/dashboard/nav-items";
import { parseWorkspaceIndexParam } from "@/lib/workspaces/utils/parse-workspace-index-param";

export function buildFacebookConnectErrorPath(workspaceIndexParam: string) {
  const parsed = parseWorkspaceIndexParam(workspaceIndexParam);

  if (parsed === null) {
    throw new Error("Workspace index is required for Facebook connect routes.");
  }

  return `${getDashboardNavHref(parsed, "connections")}/connect/facebook`;
}

export function buildFacebookSelectPagePath(workspaceIndex: number) {
  return `${getDashboardNavHref(workspaceIndex, "connections")}/connect/facebook/select-page`;
}

export function buildConnectionsPath(workspaceIndex: number) {
  return getDashboardNavHref(workspaceIndex, "connections");
}
