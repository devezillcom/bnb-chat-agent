import "server-only";

import { ChatAnthropic } from "@langchain/anthropic";
import { z } from "zod";

import { APIError } from "@/lib/exposers/api-error";
import { listAgentSkills } from "@/lib/skills/services/list-agent-skills";
import type { AgentSkillItem } from "@/lib/skills/types";
import { listAgentTools } from "@/lib/tools/services/list-agent-tools";
import { getToolDefinition, isKnownToolRegistryId } from "@/lib/tools/tool-registry";
import type { AgentToolItem } from "@/lib/tools/types";

import { AGENT_INSTRUCTIONS_IMPROVE_MODEL } from "../constants";
import type {
  ImproveAgentInstructionsParams,
  ImproveAgentInstructionsResult,
} from "../types";
import { assertAgentInWorkspace } from "../utils/assert-agent-in-workspace";
import { getAgent } from "./get-agent";

const improveResultSchema = z.object({
  systemPrompt: z
    .string()
    .trim()
    .min(1, { error: "Generated instructions cannot be empty." }),
});

type SupportedAgentTool = {
  name: string;
  registryName: string;
  description: string;
};

type ResolvedSupportedTools = {
  supported: SupportedAgentTool[];
  supportedSlugs: Set<string>;
};

/**
 * Only tools whose `registryToolId` is a known, code-defined registry entry are
 * "supported" — this mirrors how the chat runtime silently skips unknown
 * registry tools (see `listToolsBySlugs`). Unsupported tools are excluded from
 * the AI context entirely so the model never describes a capability the
 * platform can't actually run.
 */
function resolveSupportedTools(
  agentTools: AgentToolItem[],
): ResolvedSupportedTools {
  const supported: SupportedAgentTool[] = [];
  const supportedSlugs = new Set<string>();

  for (const tool of agentTools) {
    if (!isKnownToolRegistryId(tool.registryToolId)) {
      continue;
    }

    const definition = getToolDefinition(tool.registryToolId);
    if (!definition) {
      continue;
    }

    supported.push({
      name: tool.name,
      registryName: definition.name,
      description: tool.description?.trim() || definition.description,
    });
    supportedSlugs.add(tool.slug);
  }

  return { supported, supportedSlugs };
}

/**
 * Skills don't carry their own "supported" flag, but they declare which tool
 * slugs they depend on. Trim each skill's tool list down to tools that are
 * actually supported so the model doesn't reference a skill capability that
 * silently no-ops at runtime.
 */
function resolveSupportedSkills(
  skills: AgentSkillItem[],
  supportedToolSlugs: Set<string>,
): AgentSkillItem[] {
  return skills.map((skill) => ({
    ...skill,
    tools: skill.tools.filter((slug) => supportedToolSlugs.has(slug)),
  }));
}

function formatToolsSection(tools: SupportedAgentTool[]): string {
  if (tools.length === 0) {
    return "(none)";
  }

  return tools
    .map((tool) => `- ${tool.name} [${tool.registryName}]: ${tool.description}`)
    .join("\n");
}

function formatSkillsSection(skills: AgentSkillItem[]): string {
  if (skills.length === 0) {
    return "(none)";
  }

  return skills
    .map((skill) => {
      const header = skill.description
        ? `- ${skill.name}: ${skill.description}`
        : `- ${skill.name}`;
      const toolsNote = skill.tools.length
        ? `\n  Tools used: ${skill.tools.join(", ")}`
        : "";

      return `${header}${toolsNote}\n  Instructions: ${skill.instructions.trim()}`;
    })
    .join("\n\n");
}

function countWords(value: string): number {
  const trimmed = value.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

type InstructionsScenario = "empty" | "draft" | "refine";

/** Above this word count, existing instructions are treated as already complete. */
const COMPLETE_WORD_THRESHOLD = 120;

function resolveScenario(params: {
  trimmedPrompt: string;
  hasTools: boolean;
  hasSkills: boolean;
}): InstructionsScenario {
  if (!params.trimmedPrompt && !params.hasTools && !params.hasSkills) {
    return "empty";
  }

  if (countWords(params.trimmedPrompt) >= COMPLETE_WORD_THRESHOLD) {
    return "refine";
  }

  return "draft";
}

const SCENARIO_TASK_INSTRUCTIONS: Record<InstructionsScenario, string> = {
  empty:
    "The assistant has no existing instructions and no tools or skills attached yet. " +
    "Do not invent product, business, or policy details you were not given. " +
    "Write a short starter template with Markdown headings (## Role, ## Tone & style, ## Should do, ## Must not do, ## Escalation) " +
    "where each section is a single placeholder line in [square brackets] telling the user what to fill in themselves. " +
    "Keep the whole thing under 15 lines.",
  draft:
    "The existing instructions are missing or too sparse to fully describe the assistant. " +
    "Using the assistant's name, description, and the supported tools/skills listed below, write a complete, well-organized " +
    "system prompt (reuse and preserve any concrete facts already present in the existing instructions instead of discarding them). " +
    "Include: a role/persona statement, tone & style guidance, a bulleted list of things the assistant should do, a bulleted list " +
    "of things it must never do, and when to hand off to a human if relevant. " +
    "Only reference capabilities from the 'Supported tools' and 'Attached skills' lists below — never invent or imply a tool or " +
    "skill that is not listed.",
  refine:
    "The existing instructions already look complete. Do not rewrite it from scratch and do not change its intent, facts, or rules. " +
    "Refine wording, remove redundancy, and restructure with clear headers/bullets so it is unambiguous and easy for an LLM to follow. " +
    "Preserve every specific fact and rule already present. Only mention capabilities from the 'Supported tools' and 'Attached skills' " +
    "lists below; if one of them isn't reflected yet, add a brief one-line mention, but do not otherwise expand scope.",
};

const SCENARIO_RESULT_MESSAGES: Record<InstructionsScenario, string> = {
  empty: "Added a starter template — fill in the details.",
  draft: "Instructions rewritten with AI using the assistant's tools and skills.",
  refine: "Instructions refined for clarity.",
};

export async function improveAgentInstructions(
  params: ImproveAgentInstructionsParams,
): Promise<ImproveAgentInstructionsResult> {
  await assertAgentInWorkspace(params);

  if (!process.env.ANTHROPIC_API_KEY?.trim()) {
    throw new APIError(
      "ERR_ANTHROPIC_NOT_CONFIGURED",
      "Anthropic is not configured. Please set ANTHROPIC_API_KEY.",
      500,
    );
  }

  const [agent, agentTools, agentSkills] = await Promise.all([
    getAgent(params),
    listAgentTools(params),
    listAgentSkills(params),
  ]);

  const { supported: supportedTools, supportedSlugs } =
    resolveSupportedTools(agentTools);
  const supportedSkills = resolveSupportedSkills(agentSkills, supportedSlugs);

  const trimmedPrompt = params.systemPrompt.trim();
  const scenario = resolveScenario({
    trimmedPrompt,
    hasTools: supportedTools.length > 0,
    hasSkills: supportedSkills.length > 0,
  });

  const model = new ChatAnthropic({
    model: AGENT_INSTRUCTIONS_IMPROVE_MODEL,
    temperature: 0.4,
  }).withStructuredOutput(improveResultSchema);

  const result = await model.invoke([
    {
      role: "system",
      content:
        "You are an expert prompt engineer helping a small business team write the system prompt for their AI " +
        "customer-facing assistant. Write in the same language as the assistant's existing instructions, name, or " +
        "description; default to Vietnamese when there is no signal either way. Return only the improved system " +
        "prompt as Markdown (headings, lists, and emphasis where they help). Do not wrap the whole prompt in a " +
        "markdown code fence and do not add meta commentary. When referring to a tool or skill, write it as @Name " +
        "using the exact names from the lists below.",
    },
    {
      role: "user",
      content: [
        `Assistant name: ${agent.name}`,
        `Assistant description: ${agent.description?.trim() || "(none)"}`,
        "",
        "Existing instructions:",
        trimmedPrompt || "(empty)",
        "",
        "Supported tools:",
        formatToolsSection(supportedTools),
        "",
        "Attached skills:",
        formatSkillsSection(supportedSkills),
        "",
        `Task: ${SCENARIO_TASK_INSTRUCTIONS[scenario]}`,
      ].join("\n"),
    },
  ]);

  return {
    systemPrompt: result.systemPrompt,
    message: SCENARIO_RESULT_MESSAGES[scenario],
  };
}
