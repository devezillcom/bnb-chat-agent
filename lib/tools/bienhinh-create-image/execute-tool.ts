import "server-only";

import type {
  ToolExecutionContext,
  WorkspaceToolRuntime,
} from "@/lib/tools/types";
import { getConfigString } from "@/lib/tools/utils/get-config-string";

import { BIENHINH_IMAGE_POLL_MAX_ATTEMPTS } from "./constants";
import { enqueueBienhinhImagePollJob } from "./services/enqueue-bienhinh-image-poll-job";
import type { BienhinhCreateImageInput } from "./schemas/input-schema";
import {
  BIENHINH_IMAGES_API_URL,
  formatBienhinhImageToolResult,
  getBienhinhApiToken,
  parseBienhinhImageResponseBody,
} from "./utils/bienhinh-image-api";
import { storeBienhinhResultImageOnR2 } from "./utils/store-bienhinh-result-image-on-r2";

const DEFAULT_TEMPLATE_GROUP_ID = "default-template-group";
const DEFAULT_IMAGE_WORKFLOW = "standard-image";
const DEFAULT_OUTPUT_ASPECT_RATIO = "4:5";

const FIELD_CONFIG_KEYS = {
  projectName: "fields.projectName",
  phone: "fields.phone",
  headline: "fields.headline",
  extraPrompt: "fields.extraPrompt",
} as const;

function buildFields(config: Record<string, unknown>): Record<string, string> {
  const fields: Record<string, string> = {};

  for (const [fieldName, configKey] of Object.entries(FIELD_CONFIG_KEYS)) {
    const value = getConfigString(config, configKey);
    if (value) {
      fields[fieldName] = value;
    }
  }

  return fields;
}

async function maybeEnqueueImagePollJob(params: {
  requestId: string;
  executionContext?: ToolExecutionContext;
}): Promise<void> {
  const { sessionId, runContext } = params.executionContext ?? {};

  if (!sessionId || !runContext) {
    console.warn("[bienhinh-create-image] Missing session context; poll job skipped.", {
      requestId: params.requestId,
    });
    return;
  }

  await enqueueBienhinhImagePollJob({
    requestId: params.requestId,
    sessionId,
    runContext,
    attempt: 0,
    maxAttempts: BIENHINH_IMAGE_POLL_MAX_ATTEMPTS,
    delay: 0,
  });
}

export async function executeBienhinhCreateImageTool(
  tool: WorkspaceToolRuntime,
  input: BienhinhCreateImageInput,
  executionContext?: ToolExecutionContext,
): Promise<string> {
  const apiToken = getBienhinhApiToken();
  const projectId = getConfigString(tool.config, "projectId");
  const templateId = getConfigString(tool.config, "templateId");
  const styleId = getConfigString(tool.config, "styleId");

  if (!apiToken) {
    return JSON.stringify({
      error: "BIENHINH_API_TOKEN is not configured.",
    });
  }

  if (!projectId || !templateId || !styleId) {
    return JSON.stringify({
      error:
        "Bienhinh create image tool is missing projectId, templateId, or styleId configuration.",
    });
  }

  const templateGroupId =
    getConfigString(tool.config, "templateGroupId") || DEFAULT_TEMPLATE_GROUP_ID;
  const imageWorkflow =
    getConfigString(tool.config, "imageWorkflow") || DEFAULT_IMAGE_WORKFLOW;
  const outputAspectRatio =
    getConfigString(tool.config, "outputAspectRatio") ||
    DEFAULT_OUTPUT_ASPECT_RATIO;
  const fields = buildFields(tool.config);

  const body: Record<string, unknown> = {
    projectId,
    templateGroupId,
    templateId,
    styleId,
    imageWorkflow,
    outputAspectRatio,
    userImages: input.userImages,
  };

  if (Object.keys(fields).length > 0) {
    body.fields = fields;
  }

  const response = await fetch(BIENHINH_IMAGES_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiToken}`,
      Accept: "application/json, text/plain, */*",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const responseBody = await response.text();
  const parsed = parseBienhinhImageResponseBody(responseBody);

  if (!parsed) {
    return JSON.stringify({
      status: response.status,
      body: responseBody,
    });
  }

  if (parsed.status === "pending" && parsed.requestId) {
    await maybeEnqueueImagePollJob({
      requestId: parsed.requestId,
      executionContext,
    });
  }

  if (parsed.status === "completed" && parsed.imageUrl) {
    parsed.imageUrl = await storeBienhinhResultImageOnR2(parsed.imageUrl);
  }

  return formatBienhinhImageToolResult(parsed, response.status);
}
