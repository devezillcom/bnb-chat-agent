import { z } from "zod";

import { improvePrompt } from "@/lib/chat-agent/services/improve-prompt";
import { createApiHandler } from "@/lib/exposers/create-api-handler";

const improvePromptRouteParamsSchema = z.object({
  agentId: z.uuid(),
});

const improvePromptRequestBodySchema = z.object({
  prompt: z.string().optional().default(""),
  type: z.enum(["systemPrompt", "skill"]),
  selection: z.string().trim().min(1).optional(),
});

export const POST = createApiHandler(
  {
    parameters: improvePromptRouteParamsSchema,
    requestBody: improvePromptRequestBodySchema,
  },
  (params, ctx) =>
    improvePrompt({
      workspaceId: ctx.workspaceId,
      agentId: params.agentId,
      prompt: params.prompt,
      type: params.type,
      selection: params.selection,
    }),
  {
    allowedRoles: ["user", "admin"],
    minWorkspacePermission: "edit",
  },
);
