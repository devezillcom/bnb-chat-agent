import { getChatAgentImageUploadUrl } from "@/lib/chat-agent/services/get-chat-agent-image-upload-url";
import type { GetUploadSignedUrlResult } from "@/lib/r2/types";

import { EMBED_IMAGE_UPLOAD_RATE_LIMIT } from "../constants";
import type { CreateEmbedImageUploadUrlParams } from "../types";
import { verifyEmbedToken } from "../utils/embed-token";
import { assertEmbedRateLimit } from "./assert-embed-rate-limit";
import { resolveWebsiteEmbedConnectionById } from "./resolve-website-embed-connection";

export async function createEmbedImageUploadUrl(
  params: CreateEmbedImageUploadUrlParams,
): Promise<GetUploadSignedUrlResult> {
  const claims = verifyEmbedToken(params.token);
  const connection = await resolveWebsiteEmbedConnectionById(claims.connectionId);

  await assertEmbedRateLimit({
    key: `embed:images:${connection.connectionId}:${params.visitorId}`,
    limit: EMBED_IMAGE_UPLOAD_RATE_LIMIT,
  });

  return getChatAgentImageUploadUrl({
    workspaceId: connection.workspaceId,
    contentType: params.contentType,
    contentLength: params.contentLength,
  });
}
