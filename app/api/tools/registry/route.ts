import { createApiHandler } from "@/lib/exposers/create-api-handler";
import { listToolRegistry } from "@/lib/tools/services/list-tool-registry";

export const GET = createApiHandler({}, () => listToolRegistry(), {
  allowedRoles: ["user", "admin"],
  minWorkspacePermission: "read",
});
