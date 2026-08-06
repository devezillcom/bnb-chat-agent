import type { ChatAgentStreamEvent, ChatWithAgentParams } from "../types";
import { streamChatWithAgent } from "../services/stream-chat-with-agent";

function encodeStreamEvent(event: ChatAgentStreamEvent): Uint8Array {
  return new TextEncoder().encode(`${JSON.stringify(event)}\n`);
}

export function createChatAgentStreamResponse(
  params: ChatWithAgentParams,
): Response {
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const event of streamChatWithAgent(params)) {
          controller.enqueue(encodeStreamEvent(event));
        }
      } catch (error) {
        controller.enqueue(
          encodeStreamEvent({
            type: "error",
            message:
              error instanceof Error
                ? error.message
                : "The chat agent could not answer right now.",
          }),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}
