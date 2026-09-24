import "server-only";

import type { ToolRuntimeHandlers } from "../registry-runtime-types";
import { executeHttpApiTool } from "./execute-tool";

export const httpApiToolRuntime: ToolRuntimeHandlers = {
  async execute({ tool, input }) {
    return executeHttpApiTool(tool, {
      method: String(input.method ?? ""),
      path: String(input.path ?? ""),
      body: input.body == null ? undefined : String(input.body),
    });
  },
};
