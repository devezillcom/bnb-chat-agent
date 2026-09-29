import { AIMessage } from "@langchain/core/messages";
import { createMiddleware } from "langchain";

import { withMessageCreatedAt } from "./message-created-at";

export const messageCreatedAtMiddleware = createMiddleware({
  name: "MessageCreatedAtMiddleware",
  wrapModelCall: async (request, handler) => {
    const response = await handler(request);

    if (!AIMessage.isInstance(response)) {
      return response;
    }

    response.additional_kwargs = withMessageCreatedAt(
      response.additional_kwargs,
      new Date().toISOString(),
    );

    return response;
  },
});
