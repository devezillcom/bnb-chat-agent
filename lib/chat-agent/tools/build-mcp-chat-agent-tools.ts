import "server-only";

import type { StructuredToolInterface } from "@langchain/core/tools";
import { tool } from "langchain";
import { z } from "zod";

import { executeMcpTool } from "@/lib/tools/executors/execute-mcp-tool";
import type { WorkspaceToolRuntime } from "@/lib/tools/types";
import { resolveMcpSelectedTools } from "@/lib/tools/utils/parse-mcp-selected-tools";
import { allocateLangChainToolName } from "@/lib/tools/utils/to-mcp-langchain-tool-name";
import { toMcpToolZodSchema } from "@/lib/tools/utils/to-mcp-tool-input-schema";

export type BuildMcpChatAgentToolsParams = {
  workspaceTool: WorkspaceToolRuntime;
  usedNames: Set<string>;
};

function buildMcpToolDescription(
  workspaceTool: WorkspaceToolRuntime,
  mcpTool: { description: string },
): string {
  const description =
    mcpTool.description.trim() || workspaceTool.description.trim();

  return [description, `MCP server: ${workspaceTool.name}.`]
    .filter(Boolean)
    .join(" ");
}

function buildUnavailableMcpTool(
  workspaceTool: WorkspaceToolRuntime,
  usedNames: Set<string>,
  message: string,
): StructuredToolInterface {
  const name = allocateLangChainToolName(workspaceTool.slug, usedNames);

  return tool(
    async () =>
      JSON.stringify({
        error: message,
      }),
    {
      name,
      description: [
        `MCP server "${workspaceTool.name}" is unavailable.`,
        "Do not invent tool names for this server.",
        message,
      ].join(" "),
      schema: z.object({}),
    },
  );
}

export async function buildMcpChatAgentTools(
  params: BuildMcpChatAgentToolsParams,
): Promise<StructuredToolInterface[]> {
  const { workspaceTool, usedNames } = params;
  const selectedTools = resolveMcpSelectedTools(workspaceTool.config);

  if (selectedTools.length === 0) {
    return [
      buildUnavailableMcpTool(
        workspaceTool,
        usedNames,
        "No MCP tools are selected for this connection.",
      ),
    ];
  }

  return selectedTools.map((mcpTool) => {
    const name = allocateLangChainToolName(
      mcpTool.name,
      usedNames,
      workspaceTool.slug,
    );

    return tool(
      async (input) => {
        try {
          return await executeMcpTool(workspaceTool, {
            toolName: mcpTool.name,
            arguments: (input ?? {}) as Record<string, unknown>,
          });
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : "MCP tool execution failed.";

          return JSON.stringify({ error: message });
        }
      },
      {
        name,
        description: buildMcpToolDescription(workspaceTool, mcpTool),
        schema: toMcpToolZodSchema(mcpTool.inputSchema),
      },
    );
  });
}
