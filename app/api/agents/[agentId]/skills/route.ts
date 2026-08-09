import { z } from "zod";

import { listAgentSkills } from "@/lib/skills/services/list-agent-skills";
import { createApiHandler } from "@/lib/exposers/create-api-handler";

const listAgentSkillsRouteParamsSchema = z.object({
  agentId: z.uuid(),
});

export const GET = createApiHandler(
  {
    parameters: listAgentSkillsRouteParamsSchema,
  },
  (params, ctx) =>
    listAgentSkills({
      workspaceId: ctx.workspaceId,
      agentId: params.agentId,
    }),
  {
    allowedRoles: ["user", "admin"],
    minWorkspacePermission: "read",
  },
);
