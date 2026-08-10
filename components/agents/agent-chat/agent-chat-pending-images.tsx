"use client";

import { XIcon } from "lucide-react";

import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
} from "@/components/ui/attachment";

import type { PendingChatImage } from "./types";

type AgentChatPendingImagesProps = {
  images: PendingChatImage[];
  isSending: boolean;
  onRemove: (imageId: string) => void;
};

export function AgentChatPendingImages({
  images,
  isSending,
  onRemove,
}: AgentChatPendingImagesProps) {
  if (images.length === 0) return null;

  return (
    <AttachmentGroup>
      {images.map((image) => (
        <Attachment
          key={image.id}
          state={image.uploadState === "ready" ? "done" : image.uploadState}
          size="xs"
          orientation="vertical"
        >
          <AttachmentMedia variant="image">
            {/* Blob preview URLs are not supported by next/image. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image.previewUrl} alt={image.fileName} />
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>{image.fileName}</AttachmentTitle>
            <AttachmentDescription>
              {image.uploadState === "error"
                ? image.error ?? "Upload failed"
                : image.uploadState === "uploading"
                  ? "Uploading"
                  : "Ready"}
            </AttachmentDescription>
          </AttachmentContent>
          <AttachmentActions>
            <AttachmentAction
              type="button"
              aria-label={`Remove ${image.fileName}`}
              disabled={isSending}
              onClick={() => onRemove(image.id)}
            >
              <XIcon />
            </AttachmentAction>
          </AttachmentActions>
        </Attachment>
      ))}
    </AttachmentGroup>
  );
}
