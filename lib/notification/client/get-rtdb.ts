"use client";

import { getDatabase, type Database } from "firebase/database";

import { getFirebaseApp, isFirebaseRtdbConfigured } from "@/lib/firebase/client";

export function getFirebaseRtdb(): Database | null {
  if (!isFirebaseRtdbConfigured()) return null;
  const app = getFirebaseApp();
  return app ? getDatabase(app) : null;
}
