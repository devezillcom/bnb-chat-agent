import "server-only";

type BuiltinToolInput = {
  query: string;
};

export async function executeBuiltinTool(input: BuiltinToolInput): Promise<string> {
  return JSON.stringify({
    message: "Built-in tool execution is not implemented yet.",
    query: input.query.trim(),
  });
}
