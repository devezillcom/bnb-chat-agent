import "server-only";

import type { ToolRuntimeHandlers } from "../registry-runtime-types";
import { executeBuiltinTool } from "./execute-tool";

export const builtinToolRuntime: ToolRuntimeHandlers = {
  async execute({ input }) {
    return executeBuiltinTool({
      query: String(input.query ?? ""),
    });
  },
};
