import "server-only";

import { listAgentMentionItems } from "@/lib/agents/services/list-agent-mention-items";
import { listAgentToolRefs } from "@/lib/agents/services/list-agent-tool-refs";
import { listAgentKnowledgeBaseRefs } from "@/lib/knowledge-base/services/list-agent-knowledge-base-refs";
import { listAgentSkills } from "@/lib/skills/services/list-agent-skills";

import { buildChartPrompt } from "../chart/build-chart-prompt";
import {
  resolveChatEnvRuntime,
  type ActiveChatEnv,
} from "../config/chat-env";
import { buildChatAgentSkillsPrompt } from "../skills/build-chat-agent-skills-prompt";
import { buildChatAgentKnowledgePrompt } from "../knowledge/build-chat-agent-knowledge-prompt";
import type { ChatAgentToolRef } from "../schema";
import { applyMentionSlugs } from "./apply-mention-slugs";

export type ResolveWorkspaceAgentRuntimeParams = {
  agentId: string;
  workspaceId: string;
  systemPrompt: string;
  chatEnv: ActiveChatEnv;
  citationsEnabled?: boolean;
};

export type ResolveWorkspaceAgentRuntimeResult = {
  chatEnv: ActiveChatEnv;
  systemPrompt: string;
  tools: ChatAgentToolRef[];
  knowledgeBaseIds: string[];
  citationsEnabled: boolean;
};

export async function resolveWorkspaceAgentRuntime(
  params: ResolveWorkspaceAgentRuntimeParams,
): Promise<ResolveWorkspaceAgentRuntimeResult> {
  const chatEnvRuntime = resolveChatEnvRuntime(params.chatEnv);
  const citationsEnabled =
    params.citationsEnabled ?? chatEnvRuntime.citationsEnabled;

  const [mentionItems, agentSkills, agentToolRefs, knowledgeBases] =
    await Promise.all([
      listAgentMentionItems(params),
      listAgentSkills(params),
      listAgentToolRefs(params),
      listAgentKnowledgeBaseRefs(params),
    ]);
  const knowledgeBaseIds = knowledgeBases.map((knowledgeBase) => knowledgeBase.id);

  const agentSystemPrompt = applyMentionSlugs(
    params.systemPrompt.trim(),
    mentionItems,
  );
  const skillsPrompt = buildChatAgentSkillsPrompt(
    agentSkills.map((skill) => ({
      ...skill,
      instructions: applyMentionSlugs(
        skill.instructions,
        mentionItems.filter((item) => item.id !== skill.id),
      ),
    })),
  );
  const knowledgePrompt = buildChatAgentKnowledgePrompt({
    knowledgeBases,
    citationsEnabled,
  });
  const chartPrompt = params.chatEnv === "web" ? buildChartPrompt() : "";
  const systemPrompt = [
    agentSystemPrompt,
    chatEnvRuntime.systemPromptSuffix,
    skillsPrompt,
    knowledgePrompt,
    chartPrompt,
  ]
    .filter(Boolean)
    .join("\n\n");

  return {
    chatEnv: params.chatEnv,
    systemPrompt,
    tools: agentToolRefs.map((tool) => ({ id: tool.id, slug: tool.slug })),
    knowledgeBaseIds,
    citationsEnabled,
  };
}
