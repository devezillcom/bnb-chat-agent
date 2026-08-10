"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { useQueryClient } from "@tanstack/react-query";

import { readChatAgentStream } from "@/lib/chat-agent/client/read-chat-agent-stream";
import type { ActiveChatEnv } from "@/lib/chat-agent/config/chat-env";
import { resolveChatEnvRuntime } from "@/lib/chat-agent/config/chat-env";
import {
  CHAT_AGENT_IMAGE_MAX_COUNT,
  CHAT_AGENT_IMAGE_UPLOAD_RULES,
} from "@/lib/chat-agent/constants/chat-agent-image-upload-rules";
import type { ChatAgentImageAttachment } from "@/lib/chat-agent/schema";
import type {
  ChatWithAgentResult,
  GetChatAgentSessionMessagesResult,
} from "@/lib/chat-agent/types";
import type { GetUploadSignedUrlResult } from "@/lib/r2/types";
import { workspaceFetch } from "@/lib/workspaces/utils/workspace-fetch";

import type { AgentChatMessage, PendingChatImage } from "./types";

type UseAgentChatParams = {
  agentId: string;
  workspaceId: string;
  chatEnv: ActiveChatEnv;
};

function createMessageId() {
  return crypto.randomUUID();
}

export function agentChatSessionQueryKey(
  workspaceId: string,
  agentId: string,
  chatEnv: ActiveChatEnv,
  keyword = "",
) {
  return ["agent-chat-sessions", workspaceId, agentId, chatEnv, keyword] as const;
}

export function useAgentChat({
  agentId,
  workspaceId,
  chatEnv,
}: UseAgentChatParams) {
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<AgentChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string>();
  const [isSending, setIsSending] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [pendingImages, setPendingImages] = useState<PendingChatImage[]>([]);
  const usesStream = useMemo(
    () => resolveChatEnvRuntime(chatEnv).delivery === "stream",
    [chatEnv],
  );

  const pendingImagesRef = useRef(pendingImages);

  useEffect(() => {
    pendingImagesRef.current = pendingImages;
  }, [pendingImages]);

  useEffect(
    () => () => {
      for (const image of pendingImagesRef.current) {
        URL.revokeObjectURL(image.previewUrl);
      }
    },
    [],
  );

  const clearPendingImages = useCallback(() => {
    setPendingImages((current) => {
      for (const image of current) {
        URL.revokeObjectURL(image.previewUrl);
      }

      return [];
    });
  }, []);

  const removePendingImage = useCallback((imageId: string) => {
    setPendingImages((current) => {
      const target = current.find((image) => image.id === imageId);

      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }

      return current.filter((image) => image.id !== imageId);
    });
  }, []);

  const replaceLatestAssistantMessage = useCallback((content: string) => {
    setMessages((current) => {
      const lastMessage = current.at(-1);

      if (lastMessage?.role !== "assistant") {
        return [
          ...current,
          { id: createMessageId(), role: "assistant", content },
        ];
      }

      return [...current.slice(0, -1), { ...lastMessage, content }];
    });
  }, []);

  const appendAssistantToken = useCallback((content: string) => {
    setMessages((current) => {
      const lastMessage = current.at(-1);

      if (lastMessage?.role !== "assistant") {
        return [
          ...current,
          { id: createMessageId(), role: "assistant", content },
        ];
      }

      return [
        ...current.slice(0, -1),
        { ...lastMessage, content: lastMessage.content + content },
      ];
    });
  }, []);

  const uploadPendingImage = useCallback(
    async (imageId: string, file: File) => {
      try {
        const signedUrlResponse = await workspaceFetch(
          workspaceId,
          "/api/chat-agent/upload-url",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contentType: file.type,
              contentLength: file.size,
            }),
          },
        );

        if (!signedUrlResponse.ok) {
          const data = (await signedUrlResponse.json()) as {
            message?: string;
            error?: string;
          };
          throw new Error(
            data.message ?? data.error ?? "Could not prepare image upload.",
          );
        }

        const signedUrl =
          (await signedUrlResponse.json()) as GetUploadSignedUrlResult;
        const uploadResponse = await fetch(signedUrl.uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type },
          body: file,
        });

        if (!uploadResponse.ok) {
          throw new Error("Could not upload image.");
        }

        setPendingImages((current) =>
          current.map((image) =>
            image.id === imageId
              ? {
                  ...image,
                  uploadState: "ready",
                  url: signedUrl.publicUrl,
                  key: signedUrl.key,
                }
              : image,
          ),
        );
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Could not upload image.";

        setPendingImages((current) =>
          current.map((image) =>
            image.id === imageId
              ? { ...image, uploadState: "error", error: message }
              : image,
          ),
        );
      }
    },
    [workspaceId],
  );

  const handleImageInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files ?? []);
      event.target.value = "";

      const availableSlots = CHAT_AGENT_IMAGE_MAX_COUNT - pendingImages.length;
      if (availableSlots <= 0) return;

      for (const file of files.slice(0, availableSlots)) {
        const normalizedMimeType = file.type.trim().toLowerCase();
        const validationError = !CHAT_AGENT_IMAGE_UPLOAD_RULES.allowedMimes.has(
          normalizedMimeType,
        )
          ? CHAT_AGENT_IMAGE_UPLOAD_RULES.mimeError
          : file.size > CHAT_AGENT_IMAGE_UPLOAD_RULES.maxBytes
            ? CHAT_AGENT_IMAGE_UPLOAD_RULES.sizeError
            : undefined;
        const imageId = createMessageId();

        setPendingImages((current) => [
          ...current,
          {
            id: imageId,
            file,
            fileName: file.name,
            mimeType: normalizedMimeType,
            previewUrl: URL.createObjectURL(file),
            uploadState: validationError ? "error" : "uploading",
            error: validationError,
          },
        ]);

        if (!validationError) {
          void uploadPendingImage(imageId, file);
        }
      }
    },
    [pendingImages.length, uploadPendingImage],
  );

  const readyPendingImages = useMemo<ChatAgentImageAttachment[]>(
    () =>
      pendingImages
        .filter(
          (image) =>
            image.uploadState === "ready" && image.url && image.key,
        )
        .map((image) => ({
          url: image.url!,
          key: image.key,
          mimeType: image.mimeType,
          fileName: image.fileName,
        })),
    [pendingImages],
  );
  const hasUploadingImages = pendingImages.some(
    (image) => image.uploadState === "uploading",
  );

  const sendMessage = useCallback(
    async (message: string, images: ChatAgentImageAttachment[] = []) => {
      const trimmedMessage = message.trim();

      if ((!trimmedMessage && images.length === 0) || isSending) return;

      setMessages((current) => [
        ...current,
        {
          id: createMessageId(),
          role: "user",
          content: trimmedMessage,
          ...(images.length > 0 ? { images } : {}),
        },
        { id: createMessageId(), role: "assistant", content: "" },
      ]);
      clearPendingImages();
      setIsSending(true);

      try {
        const response = await workspaceFetch(workspaceId, "/api/chat-agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            agentId,
            chatEnv,
            sessionId,
            message: trimmedMessage,
            ...(images.length > 0 ? { images } : {}),
          }),
        });

        const contentType = response.headers.get("content-type") ?? "";

        if (contentType.includes("application/json")) {
          if (!response.ok) {
            throw new Error("The agent could not answer right now.");
          }

          const result = (await response.json()) as ChatWithAgentResult;
          setSessionId(result.sessionId);
          replaceLatestAssistantMessage(result.message);
          void queryClient.invalidateQueries({
            queryKey: agentChatSessionQueryKey(workspaceId, agentId, chatEnv),
          });
          return;
        }

        await readChatAgentStream(response, {
          onSession: setSessionId,
          onToken: appendAssistantToken,
          onDone: (event) => {
            setSessionId(event.sessionId);
            replaceLatestAssistantMessage(event.message);
            void queryClient.invalidateQueries({
              queryKey: agentChatSessionQueryKey(workspaceId, agentId, chatEnv),
            });
          },
          onError: replaceLatestAssistantMessage,
        });
      } catch {
        replaceLatestAssistantMessage(
          "The agent could not answer right now. Please try again.",
        );
      } finally {
        setIsSending(false);
      }
    },
    [
      agentId,
      appendAssistantToken,
      chatEnv,
      clearPendingImages,
      isSending,
      replaceLatestAssistantMessage,
      sessionId,
      queryClient,
      workspaceId,
    ],
  );

  const submitMessage = useCallback(
    (message: string) => {
      void sendMessage(message, readyPendingImages);
    },
    [readyPendingImages, sendMessage],
  );

  const loadSession = useCallback(
    async (nextSessionId: string) => {
      if (isSending || isLoadingSession || nextSessionId === sessionId) return;

      setIsLoadingSession(true);
      clearPendingImages();

      try {
        const searchParams = new URLSearchParams({
          agentId,
          chatEnv,
        });
        const response = await workspaceFetch(
          workspaceId,
          `/api/chat-agent/sessions/${nextSessionId}?${searchParams.toString()}`,
        );

        if (!response.ok) {
          throw new Error("Could not load chat session.");
        }

        const result =
          (await response.json()) as GetChatAgentSessionMessagesResult;

        setSessionId(result.sessionId);
        setMessages(
          result.messages.map((message) => ({
            id: createMessageId(),
            role: message.role,
            content: message.content,
          })),
        );
      } catch {
        setMessages([
          {
            id: createMessageId(),
            role: "assistant",
            content: "Could not load that conversation right now.",
          },
        ]);
        setSessionId(undefined);
      } finally {
        setIsLoadingSession(false);
      }
    },
    [
      agentId,
      chatEnv,
      clearPendingImages,
      isLoadingSession,
      isSending,
      sessionId,
      workspaceId,
    ],
  );

  const resetChat = useCallback(() => {
    if (isSending || isLoadingSession) return;

    setMessages([]);
    setSessionId(undefined);
    clearPendingImages();
  }, [clearPendingImages, isLoadingSession, isSending]);

  return {
    chatEnv,
    handleImageInputChange,
    hasUploadingImages,
    isLoadingSession,
    messages,
    isSending,
    loadSession,
    pendingImages,
    readyImageCount: readyPendingImages.length,
    removePendingImage,
    resetChat,
    sessionId,
    submitMessage,
    usesStream,
  };
}
