import { z } from "zod";

import type { ToolDefinition } from "../registry-types";

export const builtinTool: ToolDefinition = {
  id: "builtin",
  name: "Built-in",
  description: "Platform-provided tool with no extra configuration.",
  configSchema: z.object({}),
  configFields: [],
  inputShape: {
    fields: [
      {
        name: "query",
        type: "string",
        description: "Input passed to the built-in handler.",
        required: true,
      },
    ],
  },
};
