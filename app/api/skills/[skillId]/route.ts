import { z } from "zod";

import { createApiHandler } from "@/lib/exposers/create-api-handler";
import { skillFormSchema } from "@/lib/skills/schema";
import { deleteSkill } from "@/lib/skills/services/delete-skill";
import { getSkill } from "@/lib/skills/services/get-skill";
import { updateSkill } from "@/lib/skills/services/update-skill";

const skillRouteParamsSchema = z.object({
  skillId: z.uuid(),
});

export const GET = createApiHandler(
  {
    parameters: skillRouteParamsSchema,
  },
  (params, ctx) =>
    getSkill({
      workspaceId: ctx.workspaceId,
      skillId: params.skillId,
    }),
  {
    allowedRoles: ["user", "admin"],
    minWorkspacePermission: "read",
  },
);

export const PATCH = createApiHandler(
  {
    parameters: skillRouteParamsSchema,
    requestBody: skillFormSchema,
  },
  (params, ctx) =>
    updateSkill({
      name: params.name,
      slug: params.slug,
      description: params.description,
      instructions: params.instructions,
      tools: params.tools,
      workspaceId: ctx.workspaceId,
      skillId: params.skillId,
    }),
  {
    allowedRoles: ["user", "admin"],
    minWorkspacePermission: "edit",
  },
);

export const DELETE = createApiHandler(
  {
    parameters: skillRouteParamsSchema,
  },
  (params, ctx) =>
    deleteSkill({
      workspaceId: ctx.workspaceId,
      skillId: params.skillId,
    }),
  {
    allowedRoles: ["user", "admin"],
    minWorkspacePermission: "edit",
  },
);
