import "server-only";

import type { ToolRuntimeHandlers } from "../registry-runtime-types";
import { buildWebResearchChatAgentTools } from "./build-chat-agent-tools";

export const webResearchToolRuntime: ToolRuntimeHandlers = {
  buildChatAgentTools: buildWebResearchChatAgentTools,
};
