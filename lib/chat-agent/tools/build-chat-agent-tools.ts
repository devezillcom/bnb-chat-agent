import "server-only";

import type { RunnableConfig } from "@langchain/core/runnables";
import type { StructuredToolInterface } from "@langchain/core/tools";
import { tool } from "langchain";

import type { ChatAgentRunContext } from "@/lib/chat-agent/schema";
import { KNOWLEDGE_BASE_SEARCH_TOOL_NAME } from "@/lib/knowledge-base/constants";
import { executeWorkspaceTool } from "@/lib/tools/executors/execute-workspace-tool";
import { listToolsBySlugs } from "@/lib/tools/services/list-tools-by-slugs";
import { getToolInputZodSchema } from "@/lib/tools/tool-registry";
import type { WorkspaceToolRuntime } from "@/lib/tools/types";

import { buildMcpChatAgentTools } from "./build-mcp-chat-agent-tools";

export type BuildChatAgentToolsParams = {
  workspaceId: string;
  toolSlugs: string[];
};

type ChatAgentToolRunnableConfig = RunnableConfig & {
  context?: ChatAgentRunContext;
};

function createWorkspaceLangChainTool(workspaceTool: WorkspaceToolRuntime) {
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
}

export async function buildChatAgentTools(
  params: BuildChatAgentToolsParams,
): Promise<StructuredToolInterface[]> {
  if (params.toolSlugs.length === 0) {
    return [];
  }

  const workspaceTools = await listToolsBySlugs({
    workspaceId: params.workspaceId,
    slugs: params.toolSlugs,
  });

  const usedNames = new Set<string>([KNOWLEDGE_BASE_SEARCH_TOOL_NAME]);
  for (const workspaceTool of workspaceTools) {
    if (workspaceTool.registryToolId !== "mcp") {
      usedNames.add(workspaceTool.slug);
    }
  }

  const tools: StructuredToolInterface[] = [];

  for (const workspaceTool of workspaceTools) {
    if (workspaceTool.registryToolId === "mcp") {
      tools.push(
        ...(await buildMcpChatAgentTools({
          workspaceTool,
          usedNames,
        })),
      );
      continue;
    }

    tools.push(createWorkspaceLangChainTool(workspaceTool));
  }

  return tools;
}
