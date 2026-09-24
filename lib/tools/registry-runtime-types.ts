import type {
  BuildChatAgentToolsForWorkspaceParams,
  ExecuteRegisteredToolParams,
} from "./registry-types";
import type { StructuredToolInterface } from "@langchain/core/tools";

export type ToolRuntimeHandlers = {
  /** Build one or more LangChain tools for the agent runtime. */
  buildChatAgentTools?: (
    params: BuildChatAgentToolsForWorkspaceParams,
  ) => StructuredToolInterface[] | Promise<StructuredToolInterface[]>;
  /** Execute the tool when using the default single-tool path (slug-named tool). */
  execute?: (params: ExecuteRegisteredToolParams) => Promise<string>;
};
