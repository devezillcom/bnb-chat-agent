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
};
