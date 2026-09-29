import { getUploadSignedUrl } from "@/lib/r2/services/get-upload-signed-url";
import type { GetUploadSignedUrlResult } from "@/lib/r2/types";

import { AGENT_AVATAR_UPLOAD_RULES } from "../constants";
import { assertAgentInWorkspace } from "../utils/assert-agent-in-workspace";
import { buildAgentAvatarPathPrefix } from "../utils/build-agent-avatar-path-prefix";

export type GetAgentAvatarUploadUrlParams = {
  workspaceId: string;
  agentId: string;
  contentType: string;
  contentLength: number;
};

export async function getAgentAvatarUploadUrl(
  params: GetAgentAvatarUploadUrlParams,
): Promise<GetUploadSignedUrlResult> {
  await assertAgentInWorkspace({
    agentId: params.agentId,
    workspaceId: params.workspaceId,
  });

  return getUploadSignedUrl({
    contentType: params.contentType,
    contentLength: params.contentLength,
    maxBytes: AGENT_AVATAR_UPLOAD_RULES.maxBytes,
    allowedMimes: AGENT_AVATAR_UPLOAD_RULES.allowedMimes,
    mimeError: AGENT_AVATAR_UPLOAD_RULES.mimeError,
    sizeError: AGENT_AVATAR_UPLOAD_RULES.sizeError,
    prefix: buildAgentAvatarPathPrefix(params.workspaceId),
  });
}
