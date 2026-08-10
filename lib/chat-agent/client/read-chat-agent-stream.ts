import type { ChatAgentStreamEvent } from "../types";

export type ChatAgentStreamHandlers = {
  onSession?: (sessionId: string) => void;
  onToken?: (content: string) => void;
  onDone?: (event: Extract<ChatAgentStreamEvent, { type: "done" }>) => void;
  onError?: (message: string) => void;
};

export async function readChatAgentStream(
  response: Response,
  handlers: ChatAgentStreamHandlers,
): Promise<void> {
  if (!response.ok) {
    handlers.onError?.("Chat request failed.");
    return;
  }

  const reader = response.body?.getReader();

  if (!reader) {
    handlers.onError?.("Chat stream unavailable.");
    return;
  }

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();

    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.trim()) continue;

      try {
        const event = JSON.parse(line) as ChatAgentStreamEvent;

        if (event.type === "session") handlers.onSession?.(event.sessionId);
        if (event.type === "token") handlers.onToken?.(event.content);
        if (event.type === "done") handlers.onDone?.(event);
        if (event.type === "error") handlers.onError?.(event.message);
      } catch {
        // Ignore malformed chunks and continue reading the stream.
      }
    }
  }
}
