import { z } from "zod";

import { createAgentSkill } from "@/lib/agents/services/create-agent-skill";
import { createApiHandler } from "@/lib/exposers/create-api-handler";
import { skillFormSchema } from "@/lib/skills/schema";
import { listAgentSkills } from "@/lib/skills/services/list-agent-skills";

const agentSkillsRouteParamsSchema = z.object({
  agentId: z.uuid(),
});

export const GET = createApiHandler(
  {
    parameters: agentSkillsRouteParamsSchema,
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

export const POST = createApiHandler(
  {
    parameters: agentSkillsRouteParamsSchema,
    requestBody: skillFormSchema,
  },
  (params, ctx) =>
    createAgentSkill({
      workspaceId: ctx.workspaceId,
      agentId: params.agentId,
      name: params.name,
      slug: params.slug,
      description: params.description,
      instructions: params.instructions,
    }),
  {
    allowedRoles: ["user", "admin"],
    minWorkspacePermission: "edit",
  },
);
