import { createApiHandler } from "@/lib/exposers/create-api-handler";
import { chatWithAgentRequestSchema } from "@/lib/chat-agent/schema";
import { chatWithAgent } from "@/lib/chat-agent/services/chat-with-agent";
import { createChatAgentStreamResponse } from "@/lib/chat-agent/utils/create-chat-agent-stream-response";

export const POST = createApiHandler(
  {
    requestBody: chatWithAgentRequestSchema,
  },
  async (params, ctx) => {
    const chatParams = {
      ...params,
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
    };

    return createChatAgentStreamResponse(chatParams);
  },
  {
    allowedRoles: ["user", "admin"],
    minWorkspacePermission: "edit",
  },
);

export const PUT = createApiHandler(
  {
    requestBody: chatWithAgentRequestSchema,
  },
  (params, ctx) =>
    chatWithAgent({
      ...params,
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
    }),
  {
    allowedRoles: ["user", "admin"],
    minWorkspacePermission: "edit",
  },
);
