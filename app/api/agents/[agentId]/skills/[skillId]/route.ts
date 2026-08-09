import { z } from "zod";

import { assignAgentSkill } from "@/lib/agents/services/assign-agent-skill";
import { removeAgentSkill } from "@/lib/agents/services/remove-agent-skill";
import { createApiHandler } from "@/lib/exposers/create-api-handler";

const agentSkillRouteParamsSchema = z.object({
  agentId: z.uuid(),
  skillId: z.uuid(),
});

export const POST = createApiHandler(
  {
    parameters: agentSkillRouteParamsSchema,
  },
  (params, ctx) =>
    assignAgentSkill({
      workspaceId: ctx.workspaceId,
      agentId: params.agentId,
      capabilityId: params.skillId,
    }),
  {
    allowedRoles: ["user", "admin"],
    minWorkspacePermission: "edit",
  },
);

export const DELETE = createApiHandler(
  {
    parameters: agentSkillRouteParamsSchema,
  },
  (params, ctx) =>
    removeAgentSkill({
      workspaceId: ctx.workspaceId,
      agentId: params.agentId,
      capabilityId: params.skillId,
    }),
  {
    allowedRoles: ["user", "admin"],
    minWorkspacePermission: "edit",
  },
);
