import { createApiHandler } from "@/lib/exposers/create-api-handler";
import { createWorkspaceFormSchema } from "@/lib/workspaces/schema";
import { createWorkspace } from "@/lib/workspaces/services/create-workspace";

export const POST = createApiHandler(
  {
    requestBody: createWorkspaceFormSchema,
  },
  (params, ctx) =>
    createWorkspace({
      ...params,
      userId: ctx.userId,
    }),
  {
    allowedRoles: ["user", "admin"],
    requireWorkspace: false,
  },
);
