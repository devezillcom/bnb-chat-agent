import "server-only";

import { APIError } from "@/lib/exposers/api-error";
import { putObjectToR2 } from "@/lib/r2/services/put-object-to-r2";
import { buildR2VisionImageUrl } from "@/lib/r2/utils/build-r2-image-resize-url";
import { buildUploadObjectKey } from "@/lib/r2/utils/build-upload-object-key";
import { isMimeAllowed } from "@/lib/r2/utils/is-mime-allowed";
import { isR2HostedUrl } from "@/lib/r2/utils/is-r2-hosted-url";
import { normalizeContentType } from "@/lib/r2/utils/normalize-content-type";

import { CHAT_AGENT_IMAGE_UPLOAD_RULES } from "../constants/chat-agent-image-upload-rules";
import type { ChatAgentImageAttachment } from "../schema";
import { buildChatAgentImagePathPrefix } from "./build-chat-agent-image-path-prefix";

export type DownloadAttachmentsParams = {
  attachments: ChatAgentImageAttachment[];
  workspaceId: string;
};

async function downloadAttachmentUrl(url: string): Promise<{
  body: Buffer;
  contentType: string | undefined;
}> {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new APIError(
      "ERR_IMAGE_FETCH_FAILED",
      `Could not download attachment (${response.status}).`,
      400,
    );
  }

  return {
    body: Buffer.from(await response.arrayBuffer()),
    contentType: response.headers.get("content-type") ?? undefined,
  };
}

function isAllowedAttachment(body: Buffer, contentType: string): boolean {
  return (
    body.length <= CHAT_AGENT_IMAGE_UPLOAD_RULES.maxBytes &&
    isMimeAllowed(contentType, CHAT_AGENT_IMAGE_UPLOAD_RULES.allowedMimes)
  );
}

async function resolveAttachment(
  attachment: ChatAgentImageAttachment,
  workspaceId: string,
): Promise<ChatAgentImageAttachment> {
  if (isR2HostedUrl(attachment.url)) {
    return attachment;
  }

  const downloaded = await downloadAttachmentUrl(attachment.url);
  const mimeType = normalizeContentType(
    attachment.mimeType ??
      downloaded.contentType ??
      "application/octet-stream",
  );

  if (!isAllowedAttachment(downloaded.body, mimeType)) {
    throw new APIError(
      "ERR_IMAGE_UNSUPPORTED",
      CHAT_AGENT_IMAGE_UPLOAD_RULES.mimeError,
      400,
    );
  }

  const key = buildUploadObjectKey({
    prefix: `${buildChatAgentImagePathPrefix(workspaceId)}/downloaded`,
    contentType: mimeType,
  });

  const stored = await putObjectToR2({
    key,
    body: downloaded.body,
    contentType: mimeType,
  });

  return {
    ...attachment,
    url: buildR2VisionImageUrl(stored.publicUrl),
    key: stored.key,
    mimeType,
  };
}

export async function downloadAttachments(
  params: DownloadAttachmentsParams,
): Promise<ChatAgentImageAttachment[]> {
  return Promise.all(
    params.attachments.map((attachment) =>
      resolveAttachment(attachment, params.workspaceId),
    ),
  );
}
