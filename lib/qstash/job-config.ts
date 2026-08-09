import { handleRefreshConnectionConnectQstashJob } from "@/lib/connections/services/handle-refresh-connection-connect-qstash-job";
import { handleFacebookMessengerInboundQstashJob } from "@/lib/connections/services/handle-facebook-messenger-inbound-qstash-job";
import { handleKnowledgeBaseDocumentProcessQstashJob } from "@/lib/knowledge-base/services/handle-knowledge-base-document-process-qstash-job";

export type QstashJobHandlerContext = {
  userId?: string;
};

export type QstashJobHandler = (
  payload: unknown,
  context: QstashJobHandlerContext,
) => Promise<void> | void;

/**
 * Registry of QStash job handlers keyed by job name.
 * Add new jobs here as the app grows.
 */
export const qstashJobHandlers: Record<string, QstashJobHandler> = {
  "noop-job": async () => {
    // Placeholder handler for barebone setup.
  },
  "refresh-connection-connect": handleRefreshConnectionConnectQstashJob,
  "facebook-messenger-inbound": handleFacebookMessengerInboundQstashJob,
  "knowledge-base-document-process": handleKnowledgeBaseDocumentProcessQstashJob,
};
