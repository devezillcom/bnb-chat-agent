import "server-only";

import { ChatAnthropic } from "@langchain/anthropic";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { ChatOpenAI } from "@langchain/openai";

import { APIError } from "@/lib/exposers/api-error";

import {
  getChatModelDefinition,
  type ChatModelId,
  type ChatModelProvider,
} from "./registry";

export type { ChatModelId } from "./registry";
export { parseChatModel } from "./registry";

export type CreateChatModelOptions = {
  temperature?: number;
};

export function isChatModelConfigured(model: ChatModelId): boolean {
  const { provider } = getChatModelDefinition(model);

  if (provider === "openai") {
    return Boolean(process.env.OPENAI_API_KEY?.trim());
  }

  return Boolean(process.env.ANTHROPIC_API_KEY?.trim());
}

function assertProviderApiKey(provider: ChatModelProvider) {
  if (provider === "openai" && !process.env.OPENAI_API_KEY) {
    throw new APIError(
      "ERR_OPENAI_NOT_CONFIGURED",
      "OpenAI is not configured. Please set OPENAI_API_KEY.",
      500,
    );
  }

  if (provider === "anthropic" && !process.env.ANTHROPIC_API_KEY) {
    throw new APIError(
      "ERR_ANTHROPIC_NOT_CONFIGURED",
      "Anthropic is not configured. Please set ANTHROPIC_API_KEY.",
      500,
    );
  }
}

export function createChatModel(
  model: ChatModelId,
  options?: CreateChatModelOptions,
): BaseChatModel {
  const definition = getChatModelDefinition(model);
  assertProviderApiKey(definition.provider);
  const temperature = options?.temperature ?? 0.2;

  if (definition.provider === "openai") {
    return new ChatOpenAI({
      model: definition.modelName,
      ...(definition.supportsTemperature ? { temperature } : {}),
    });
  }

  return new ChatAnthropic({
    model: definition.modelName,
    ...(definition.supportsTemperature ? { temperature } : {}),
  });
}
