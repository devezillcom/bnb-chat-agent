"use client";

import { useRef, type ChangeEvent } from "react";
import { ArrowUpIcon, ImageIcon } from "lucide-react";

import { RichInput } from "@/components/rich-input";
import { Button } from "@/components/ui/button";
import {
  CHAT_AGENT_IMAGE_ACCEPT,
  CHAT_AGENT_IMAGE_MAX_COUNT,
} from "@/lib/chat-agent/constants/chat-agent-image-upload-rules";

import { AgentChatPendingImages } from "./agent-chat-pending-images";
import type { PendingChatImage } from "./types";

type AgentChatComposerProps = {
  input: string;
  isSending: boolean;
  pendingImages: PendingChatImage[];
  onInputChange: (value: string) => void;
  onImageInputChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemovePendingImage: (imageId: string) => void;
  onSend: (message: string) => void;
  canSend: boolean;
};

export function AgentChatComposer({
  input,
  isSending,
  pendingImages,
  onInputChange,
  onImageInputChange,
  onRemovePendingImage,
  onSend,
  canSend,
}: AgentChatComposerProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);

  function handleSend(message: string) {
    if (canSend) {
      onSend(message);
    }
  }

  return (
    <form
      className="shrink-0 bg-background px-4 pb-4 pt-3 md:px-8 md:pb-8"
      onSubmit={(event) => {
        event.preventDefault();
        handleSend(input);
      }}
    >
      <div className="mx-auto w-full max-w-2xl">
        <div className="flex flex-col rounded-3xl bg-muted p-3">
          <AgentChatPendingImages
            images={pendingImages}
            isSending={isSending}
            onRemove={onRemovePendingImage}
          />
          <RichInput
            value={input}
            onChange={onInputChange}
            onSubmit={handleSend}
            clearOnSubmit={false}
            placeholder="Message this agent…"
            ariaLabel="Message this agent"
            className="max-h-32 min-h-10 px-1 py-1"
            containerClassName="min-h-10 border-0 bg-transparent shadow-none focus-within:border-0 focus-within:ring-0"
          />
          <div className="flex items-center justify-between pt-1">
            <input
              ref={imageInputRef}
              type="file"
              accept={CHAT_AGENT_IMAGE_ACCEPT}
              multiple
              className="hidden"
              onChange={onImageInputChange}
              disabled={
                isSending || pendingImages.length >= CHAT_AGENT_IMAGE_MAX_COUNT
              }
            />
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              className="rounded-full bg-background"
              aria-label="Upload image"
              disabled={
                isSending || pendingImages.length >= CHAT_AGENT_IMAGE_MAX_COUNT
              }
              onClick={() => imageInputRef.current?.click()}
            >
              <ImageIcon />
            </Button>
            <Button
              type="submit"
              size="icon-sm"
              className="rounded-full"
              aria-label="Send message"
              disabled={!canSend}
            >
              <ArrowUpIcon />
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
