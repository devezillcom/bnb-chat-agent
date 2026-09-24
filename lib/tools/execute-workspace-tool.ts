import "server-only";

import { getRegisteredTool } from "./tool-registry";
import type { ToolExecutionContext, WorkspaceToolRuntime } from "./types";

export async function executeWorkspaceTool(
  tool: WorkspaceToolRuntime,
  input: Record<string, unknown>,
  executionContext?: ToolExecutionContext,
): Promise<string> {
  const registeredTool = getRegisteredTool(tool.registryToolId);
  if (!registeredTool?.execute) {
    return JSON.stringify({
      error: `Unsupported registry tool: ${tool.registryToolId}`,
    });
  }

  return registeredTool.execute({
    tool,
    input,
    sessionId: executionContext?.sessionId,
    runContext: executionContext?.runContext,
  });
}
