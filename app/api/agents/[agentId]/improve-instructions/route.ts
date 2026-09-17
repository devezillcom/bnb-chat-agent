import { z } from "zod";

import { improveAgentInstructions } from "@/lib/agents/services/improve-agent-instructions";
import { createApiHandler } from "@/lib/exposers/create-api-handler";

const improveAgentInstructionsRouteParamsSchema = z.object({
  agentId: z.uuid(),
});

const improveAgentInstructionsRequestBodySchema = z.object({
  systemPrompt: z.string().optional().default(""),
});

export const POST = createApiHandler(
  {
    parameters: improveAgentInstructionsRouteParamsSchema,
    requestBody: improveAgentInstructionsRequestBodySchema,
  },
  (params, ctx) =>
    improveAgentInstructions({
      workspaceId: ctx.workspaceId,
      agentId: params.agentId,
      systemPrompt: params.systemPrompt,
    }),
  {
    allowedRoles: ["user", "admin"],
    minWorkspacePermission: "edit",
  },
);
