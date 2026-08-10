import "server-only";

import type { RunnableConfig } from "@langchain/core/runnables";
import { tool } from "langchain";

import type { ChatAgentRunContext } from "@/lib/chat-agent/schema";
import { executeWorkspaceTool } from "@/lib/tools/executors/execute-workspace-tool";
import { listToolsBySlugs } from "@/lib/tools/services/list-tools-by-slugs";
import { getToolInputZodSchema } from "@/lib/tools/tool-registry";

export type BuildChatAgentToolsParams = {
  workspaceId: string;
  toolSlugs: string[];
};

type ChatAgentToolRunnableConfig = RunnableConfig & {
  context?: ChatAgentRunContext;
};

export async function buildChatAgentTools(params: BuildChatAgentToolsParams) {
  if (params.toolSlugs.length === 0) {
    return [];
  }

  const workspaceTools = await listToolsBySlugs({
    workspaceId: params.workspaceId,
    slugs: params.toolSlugs,
  });

  return workspaceTools.map((workspaceTool) => {
    const schema = getToolInputZodSchema(workspaceTool.registryToolId);

    return tool(
      async (input, config: ChatAgentToolRunnableConfig) => {
        try {
          const sessionId =
            typeof config.configurable?.thread_id === "string"
              ? config.configurable.thread_id
              : undefined;

          return await executeWorkspaceTool(
            workspaceTool,
            input as Record<string, unknown>,
            {
              sessionId,
              runContext: config.context,
            },
          );
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Tool execution failed.";

          return JSON.stringify({ error: message });
        }
      },
      {
        name: workspaceTool.slug,
        description: workspaceTool.description,
        schema,
      },
    );
  });
}
