import "server-only";

import { tool } from "langchain";

import { executeWorkspaceTool } from "@/lib/tools/executors/execute-workspace-tool";
import { listToolsBySlugs } from "@/lib/tools/services/list-tools-by-slugs";
import { getToolDefinition } from "@/lib/tools/tool-registry";
import { dataShapeToZodSchema } from "@/lib/tools/utils/data-shape-to-zod-schema";

export type BuildChatAgentToolsParams = {
  workspaceId: string;
  toolSlugs: string[];
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
    const definition = getToolDefinition(workspaceTool.registryToolId)!;
    const schema = dataShapeToZodSchema(definition.inputShape);

    return tool(
      async (input) => {
        try {
          return await executeWorkspaceTool(workspaceTool, input);
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
