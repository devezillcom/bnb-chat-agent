import { CHAT_AGENT_IMAGE_UPLOAD_RULES } from "@/lib/chat-agent/constants/chat-agent-image-upload-rules";
import type { ChatAgentImageAttachment } from "@/lib/chat-agent/schema";
import { buildChatAgentImagePathPrefix } from "@/lib/chat-agent/utils/build-chat-agent-image-path-prefix";
import { APIError } from "@/lib/exposers/api-error";
import { isMimeAllowed } from "@/lib/r2/utils/is-mime-allowed";
import { normalizeContentType } from "@/lib/r2/utils/normalize-content-type";

export function assertEmbedImageAttachments(params: {
  images: ChatAgentImageAttachment[] | undefined;
  workspaceId: string;
}): ChatAgentImageAttachment[] {
  const images = params.images ?? [];
  if (images.length === 0) {
    return [];
  }

  const publicBase = process.env.R2_PUBLIC_URL?.trim().replace(/\/$/, "");
  if (!publicBase) {
    throw new APIError("ERR_NOT_CONFIGURED", "Upload is not configured", 503);
  }

  const prefix = `${buildChatAgentImagePathPrefix(params.workspaceId)}/`;

  return images.map((image) => {
    const key = image.key?.trim() ?? "";
    if (!key.startsWith(prefix) || key.includes("..")) {
      throw new APIError("ERR_EMBED_IMAGE_INVALID", "Image is invalid.", 400);
    }

    const url = image.url.trim();
    if (url !== `${publicBase}/${key}`) {
      throw new APIError("ERR_EMBED_IMAGE_INVALID", "Image is invalid.", 400);
    }

    const mimeType = image.mimeType?.trim();
    if (
      mimeType &&
      !isMimeAllowed(
        normalizeContentType(mimeType),
        CHAT_AGENT_IMAGE_UPLOAD_RULES.allowedMimes,
      )
    ) {
      throw new APIError(
        "ERR_UPLOAD_MIME",
        CHAT_AGENT_IMAGE_UPLOAD_RULES.mimeError,
        400,
      );
    }

    return {
      url,
      key,
      mimeType: mimeType ? normalizeContentType(mimeType) : undefined,
      fileName: image.fileName?.trim() || undefined,
    };
  });
}
