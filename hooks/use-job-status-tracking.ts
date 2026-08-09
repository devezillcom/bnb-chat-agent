"use client";

import { useCallback, useMemo, useRef, useSyncExternalStore } from "react";
import { onValue, ref } from "firebase/database";
import { isFirebaseRtdbConfigured } from "@/lib/firebase/client";
import { getFirebaseRtdb } from "@/lib/notification/client/get-rtdb";
import { NOTIFICATION_JOBS_PATH } from "@/lib/notification/constants";
import type { JobRecord } from "@/lib/notification/types";

function isJobRecord<T extends Record<string, unknown>>(val: unknown): val is JobRecord<T> {
  if (!val || typeof val !== "object") return false;
  const o = val as Record<string, unknown>;
  return (
    typeof o.status === "string" &&
    typeof o.createdAt === "number" &&
    typeof o.updatedAt === "number" &&
    "payload" in o &&
    typeof o.payload === "object" &&
    o.payload !== null &&
    !Array.isArray(o.payload)
  );
}

type JobView<T extends Record<string, unknown>> = {
  job: JobRecord<T> | null;
  loading: boolean;
  error: string | null;
};

const serverJobView: JobView<Record<string, unknown>> = {
  job: null,
  loading: false,
  error: null,
};

const idleJobView = { job: null, loading: false, error: null } as const;

export function useJobStatusTracking<T extends Record<string, unknown> = Record<string, unknown>>(
  jobKey: string | null | undefined,
): JobView<T> {
  const path = useMemo(() => {
    const key = jobKey?.trim();
    if (!key) return null;
    return `${NOTIFICATION_JOBS_PATH}/${key}`;
  }, [jobKey]);

  const snapshotRef = useRef<JobView<T>>({
    job: null,
    loading: true,
    error: null,
  });

  const subscribe = useCallback(
    (onChange: () => void) => {
      if (!path) {
        return () => {};
      }

      if (!isFirebaseRtdbConfigured()) {
        snapshotRef.current = {
          job: null,
          loading: false,
          error: "Realtime Database is not configured (missing NEXT_PUBLIC_FIREBASE_DATABASE_URL)",
        };
        onChange();
        return () => {};
      }

      const db = getFirebaseRtdb();
      if (!db) {
        snapshotRef.current = {
          job: null,
          loading: false,
          error: "Firebase app is not available",
        };
        onChange();
        return () => {};
      }

      snapshotRef.current = {
        job: null,
        loading: true,
        error: null,
      };
      onChange();

      const r = ref(db, path);

      const unsub = onValue(
        r,
        (snap) => {
          const val = snap.val();
          if (val == null) {
            snapshotRef.current = { job: null, loading: false, error: null };
            onChange();
            return;
          }
          if (!isJobRecord<T>(val)) {
            snapshotRef.current = {
              job: null,
              loading: false,
              error: "Invalid job document shape",
            };
            onChange();
            return;
          }
          snapshotRef.current = { job: val, loading: false, error: null };
          onChange();
        },
        (err) => {
          snapshotRef.current = {
            job: null,
            loading: false,
            error: err.message,
          };
          onChange();
        },
      );

      return unsub;
    },
    [path],
  );

  const getSnapshot = useCallback(() => snapshotRef.current, []);

  const state = useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => serverJobView as JobView<T>,
  );

  if (!path) {
    return { ...idleJobView };
  }

  return state;
}
