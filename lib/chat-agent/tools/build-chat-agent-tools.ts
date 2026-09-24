import "server-only";

import type { RunnableConfig } from "@langchain/core/runnables";
import type { StructuredToolInterface } from "@langchain/core/tools";
import { tool } from "langchain";

import { listToolsByIds } from "@/lib/tools/services/list-tools-by-ids";
import {
  getRegisteredTool,
  getToolInputZodSchema,
} from "@/lib/tools/tool-registry";
import type { WorkspaceToolRuntime } from "@/lib/tools/types";

import type { ChatAgentRunContext, ChatAgentToolRef } from "../schema";

export type BuildChatAgentToolsParams = {
  workspaceId: string;
  /** Assigned tools with runtime slugs from `resolveWorkspaceAgentRuntime`. */
  tools: ChatAgentToolRef[];
};

export type BuiltChatAgentTool = {
  tool: StructuredToolInterface;
};

type ChatAgentToolRunnableConfig = RunnableConfig & {
  context?: ChatAgentRunContext;
};

function createDefaultLangChainTool(workspaceTool: WorkspaceToolRuntime) {
  const registeredTool = getRegisteredTool(workspaceTool.registryToolId);
  if (!registeredTool?.execute) {
    throw new Error(
      `Registry tool "${workspaceTool.registryToolId}" has no execute handler.`,
    );
  }

  const schema = getToolInputZodSchema(workspaceTool.registryToolId);

  return tool(
    async (input, config: ChatAgentToolRunnableConfig) => {
      try {
        const sessionId =
          typeof config.configurable?.thread_id === "string"
            ? config.configurable.thread_id
            : undefined;

        return await registeredTool.execute!({
          tool: workspaceTool,
          input: input as Record<string, unknown>,
          sessionId,
          runContext: config.context,
        });
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
): Promise<BuiltChatAgentTool[]> {
  if (params.tools.length === 0) {
    return [];
  }

  const slugByToolId = new Map(
    params.tools.map((toolRef) => [toolRef.id, toolRef.slug]),
  );
  const toolRecords = await listToolsByIds({
    workspaceId: params.workspaceId,
    toolIds: [...slugByToolId.keys()],
  });

  // Preserve the caller's order so slug allocation and tool order stay stable.
  const recordById = new Map(toolRecords.map((record) => [record.id, record]));
  const workspaceTools: WorkspaceToolRuntime[] = [];
  for (const toolRef of params.tools) {
    const record = recordById.get(toolRef.id);
    if (record) {
      workspaceTools.push({ ...record, slug: toolRef.slug });
    }
  }

  const tools: BuiltChatAgentTool[] = [];

  for (const workspaceTool of workspaceTools) {
    const registeredTool = getRegisteredTool(workspaceTool.registryToolId);
    if (!registeredTool) {
      continue;
    }

    if (registeredTool.buildChatAgentTools) {
      const builtTools = await registeredTool.buildChatAgentTools({
        workspaceTool,
      });

      tools.push(...builtTools.map((builtTool) => ({ tool: builtTool })));
      continue;
    }

    tools.push({
      tool: createDefaultLangChainTool(workspaceTool),
    });
  }

  return tools;
}
