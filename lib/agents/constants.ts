/** Model used to draft/refine an agent's system prompt for the "Improve with AI" action. */
export const AGENT_INSTRUCTIONS_IMPROVE_MODEL =
  process.env.AGENT_INSTRUCTIONS_IMPROVE_MODEL?.trim() || "claude-sonnet-4-6";
