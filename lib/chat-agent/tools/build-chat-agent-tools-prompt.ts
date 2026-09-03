import type { StructuredToolInterface } from "@langchain/core/tools";

export function buildChatAgentToolsPrompt(
  tools: StructuredToolInterface[],
): string {
  if (tools.length === 0) {
    return "";
  }

  const lines = tools.map((tool) => {
    const description = tool.description?.trim();
    return description
      ? `- \`${tool.name}\`: ${description}`
      : `- \`${tool.name}\``;
  });

  return [
    "# Tools",
    "",
    "Call tools by these exact names:",
    "",
    ...lines,
  ].join("\n");
}
