/** Model used to draft/refine an agent's system prompt for the "Improve with AI" action. */
export const AGENT_INSTRUCTIONS_IMPROVE_MODEL =
  process.env.AGENT_INSTRUCTIONS_IMPROVE_MODEL?.trim() || "gpt-4.1";
