import "server-only";

import type { ToolRuntimeHandlers } from "../registry-runtime-types";
import { executeBienhinhCreateImageTool } from "./execute-tool";
import { bienhinhCreateImageInputSchema } from "./schemas/input-schema";

export const bienhinhCreateImageToolRuntime: ToolRuntimeHandlers = {
  async execute({ tool, input, sessionId, runContext }) {
    const parsed = bienhinhCreateImageInputSchema.safeParse(input);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return JSON.stringify({
        error: firstIssue?.message ?? "Invalid create image input.",
      });
    }

    return executeBienhinhCreateImageTool(tool, parsed.data, {
      sessionId,
      runContext,
    });
  },
};
