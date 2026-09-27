import { createWebsiteConnection } from "@/lib/connections/services/create-website-connection";
import { websiteConnectionFormSchema } from "@/lib/connections/schema";
import { createApiHandler } from "@/lib/exposers/create-api-handler";

export const POST = createApiHandler(
  {
    requestBody: websiteConnectionFormSchema,
  },
  (params, ctx) =>
    createWebsiteConnection({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      name: params.name,
      websiteUrl: params.websiteUrl,
      agentId: params.agentId,
    }),
  {
    allowedRoles: ["user", "admin"],
    minWorkspacePermission: "edit",
  },
);
