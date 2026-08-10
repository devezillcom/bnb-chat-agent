import {
  CHAT_AGENT_IMAGE_UPLOAD_RULES,
} from "../constants/chat-agent-image-upload-rules";
import type { ChatAgentImageUploadUrlRequest } from "../schema";
import { getUploadSignedUrl } from "@/lib/r2/services/get-upload-signed-url";
import type { GetUploadSignedUrlResult } from "@/lib/r2/types";
import { buildChatAgentImagePathPrefix } from "../utils/build-chat-agent-image-path-prefix";

export type GetChatAgentImageUploadUrlParams =
  ChatAgentImageUploadUrlRequest & {
    workspaceId: string;
  };

export async function getChatAgentImageUploadUrl(
  params: GetChatAgentImageUploadUrlParams,
): Promise<GetUploadSignedUrlResult> {
  return getUploadSignedUrl({
    contentType: params.contentType,
    contentLength: params.contentLength,
    maxBytes: CHAT_AGENT_IMAGE_UPLOAD_RULES.maxBytes,
    allowedMimes: CHAT_AGENT_IMAGE_UPLOAD_RULES.allowedMimes,
    mimeError: CHAT_AGENT_IMAGE_UPLOAD_RULES.mimeError,
    sizeError: CHAT_AGENT_IMAGE_UPLOAD_RULES.sizeError,
    prefix: buildChatAgentImagePathPrefix(params.workspaceId),
  });
}
