"use client";

import { onValue, ref, runTransaction } from "firebase/database";
import { useCallback, useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import type { ZodType } from "zod";
import { isFirebaseRtdbConfigured } from "@/lib/firebase/client";
import { getFirebaseRtdb } from "@/lib/notification/client/get-rtdb";
import type { ChannelNotificationRecord } from "@/lib/notification/types";
import { parseRtdbPath } from "@/lib/notification/utils/parse-rtdb-path-key";

type UseChannelNotificationParams<TPayload extends Record<string, unknown>> = {
  /** Absolute RTDB path to the channel notification node. */
  path: string;
  payloadSchema?: ZodType<TPayload>;
  onDataChange?: (data: UseChannelNotificationData<TPayload>) => void;
};

type UseChannelNotificationData<TPayload extends Record<string, unknown>> = ChannelNotificationRecord<TPayload> | null | undefined;

type UseChannelNotificationResult<TPayload extends Record<string, unknown>> = {

  /**
   * The current channel notification record.
   * `null` if the record does exist but is empty.
   * `undefined` loading the record.
   */
  data: UseChannelNotificationData<TPayload>;

  emit: (payload: TPayload) => Promise<void>;
};

export function useChannelNotification<TPayload extends Record<string, unknown>>({
  path,
  payloadSchema,
  onDataChange,
}: UseChannelNotificationParams<TPayload>): UseChannelNotificationResult<TPayload> {

  const dbPath = useMemo(() => {
    const trimmed = path.trim();
    if (!trimmed) return "";
    return parseRtdbPath(trimmed);
  }, [path]);

  const snapshotRef = useRef<UseChannelNotificationData<TPayload>>(undefined);

  const subscribe = useCallback(
    (onChange: () => void) => {
      if (!dbPath || !isFirebaseRtdbConfigured()) {
        snapshotRef.current = null;
        onChange();
        return () => { };
      }

      const db = getFirebaseRtdb();
      if (!db) {
        snapshotRef.current = null;
        onChange();
        return () => { };
      }

      const dbRef = ref(db, dbPath);
      const unsubscribe = onValue(
        dbRef,
        (snapshot) => {
          let value: ChannelNotificationRecord<TPayload> | null = snapshot.val();
          if (value?.payload && payloadSchema) {
            const parsed = payloadSchema.safeParse(value.payload);
            if (!parsed.success) {
              console.warn("Invalid channel notification payload shape", parsed.error);
              value = null;
            }
          }
          snapshotRef.current = value;
          onChange();
        },
        () => {
          snapshotRef.current = null;
          onChange();
        },
      );

      return unsubscribe;
    },
    [dbPath, payloadSchema],
  );

  const getSnapshot = useCallback(() => snapshotRef.current, []);
  const data = useSyncExternalStore(subscribe, getSnapshot, () => null);

  const previousDataRef = useRef<ChannelNotificationRecord<TPayload> | null | undefined>(undefined);

  useEffect(() => {
    if (!onDataChange || data === undefined) return;

    const isFirstLoad = previousDataRef.current === undefined;
    previousDataRef.current = data;

    if (isFirstLoad) {
      return;
    }

    const clientId = getClientId();
    if (data?.clientId === clientId) {
      return;
    }

    onDataChange(data);
  }, [data, onDataChange]);

  const emit = useCallback(
    async (payload: TPayload) => {
      if (payloadSchema) {
        const parsed = payloadSchema.safeParse(payload);
        if (!parsed.success) {
          throw new Error("Invalid channel notification payload shape");
        }
      }

      const db = getFirebaseRtdb();
      if (!db) {
        throw new Error("Firebase app is not available");
      }

      const clientId = getClientId();
      const dbRef = ref(db, dbPath);

      const result = await runTransaction(dbRef, (current) => {
        const now = Date.now();
        if (current == null) {
          const row: ChannelNotificationRecord<TPayload> = {
            payload,
            clientId,
            createdAt: now,
            updatedAt: now,
          };
          return row;
        }

        const prev = current as Partial<ChannelNotificationRecord<TPayload>>;
        const createdAt = typeof prev.createdAt === "number" ? prev.createdAt : now;
        const next: ChannelNotificationRecord<TPayload> = {
          payload,
          clientId,
          createdAt,
          updatedAt: now,
        };
        return next;
      });

      if (!result.committed) {
        throw new Error("Could not write channel notification");
      }
    },
    [dbPath, payloadSchema],
  );

  return { data, emit };
}

/**
 * Returns a unique client ID for the current browser tab.
 * Uses session storage to persist the ID across page reloads.
 */
export function getClientId(): string {
  let clientId = sessionStorage.getItem("tabId");
  if (!clientId) {
    // crypto.randomUUID may not be available in all browsers yet
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      clientId = crypto.randomUUID();
    } else {
      // Fallback: build a simple UUID v4-like string
      clientId = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
    }
    sessionStorage.setItem("tabId", clientId);
  }
  return clientId;
}
