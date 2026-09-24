import { z } from "zod";

import { createApiHandler } from "@/lib/exposers/create-api-handler";
import { listMcpAvailableTools } from "@/lib/tools/mcp/services/list-mcp-available-tools";

const listMcpAvailableToolsBodySchema = z.object({
  config: z.record(z.string(), z.unknown()),
});

export const POST = createApiHandler(
  {
    requestBody: listMcpAvailableToolsBodySchema,
  },
  (params) => listMcpAvailableTools({ config: params.config }),
  {
    allowedRoles: ["user", "admin"],
    minWorkspacePermission: "read",
  },
);
