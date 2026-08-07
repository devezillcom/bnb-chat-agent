import type { ChatAgentImageAttachment } from "@/lib/chat-agent/schema";
import { CHAT_AGENT_IMAGE_MAX_COUNT } from "@/lib/chat-agent/constants/chat-agent-image-upload-rules";
import { CHAT_AGENT_IMAGE_UPLOAD_RULES } from "@/lib/chat-agent/constants/chat-agent-image-upload-rules";
import { isMimeAllowed } from "@/lib/r2/utils/is-mime-allowed";
import { buildUploadObjectKey } from "@/lib/r2/utils/build-upload-object-key";
import { buildR2VisionImageUrl } from "@/lib/r2/utils/build-r2-image-resize-url";
import { putObjectToR2 } from "@/lib/r2/services/put-object-to-r2";
import { isR2Configured } from "@/lib/r2/utils/get-r2-s3-client";

import { FACEBOOK_INBOUND_IMAGE_R2_PREFIX } from "../constants";
import { fetchFacebookAttachmentImage } from "../utils/fetch-facebook-attachment-image";

export type FacebookInboundImageAttachment = {
  type: string;
  url: string;
};

export type StoreFacebookInboundImagesParams = {
  attachments: FacebookInboundImageAttachment[];
  pageAccessToken: string;
  workspaceId: string;
  connectionId: string;
};

function filterImageAttachments(
  attachments: FacebookInboundImageAttachment[],
): FacebookInboundImageAttachment[] {
  return attachments
    .filter(
      (attachment) =>
        attachment.type === "image" && attachment.url.trim().length > 0,
    )
    .slice(0, CHAT_AGENT_IMAGE_MAX_COUNT);
}

function isAllowedInboundImage(body: Buffer, contentType: string): boolean {
  return (
    body.length <= CHAT_AGENT_IMAGE_UPLOAD_RULES.maxBytes &&
    isMimeAllowed(contentType, CHAT_AGENT_IMAGE_UPLOAD_RULES.allowedMimes)
  );
}

async function storeImageOnR2(params: {
  body: Buffer;
  contentType: string;
  workspaceId: string;
  connectionId: string;
}): Promise<ChatAgentImageAttachment> {
  const key = buildUploadObjectKey({
    prefix: `${FACEBOOK_INBOUND_IMAGE_R2_PREFIX}/${params.workspaceId}/${params.connectionId}`,
    contentType: params.contentType,
  });

  const stored = await putObjectToR2({
    key,
    body: params.body,
    contentType: params.contentType,
  });

  return {
    url: buildR2VisionImageUrl(stored.publicUrl),
    mimeType: params.contentType,
  };
}

export async function storeFacebookInboundImages(
  params: StoreFacebookInboundImagesParams,
): Promise<ChatAgentImageAttachment[]> {
  const imageAttachments = filterImageAttachments(params.attachments);

  if (imageAttachments.length === 0) {
    return [];
  }

  const results: ChatAgentImageAttachment[] = [];

  for (const attachment of imageAttachments) {
    const fetched = await fetchFacebookAttachmentImage({
      url: attachment.url,
      pageAccessToken: params.pageAccessToken,
    });

    if (!isAllowedInboundImage(fetched.body, fetched.contentType)) {
      continue;
    }

    if (isR2Configured()) {
      results.push(
        await storeImageOnR2({
          body: fetched.body,
          contentType: fetched.contentType,
          workspaceId: params.workspaceId,
          connectionId: params.connectionId,
        }),
      );
      continue;
    }

    results.push({
      url: attachment.url,
      mimeType: fetched.contentType,
    });
  }

  return results;
}
