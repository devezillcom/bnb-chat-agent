export function readFirebaseDatabaseUrl() {
  const url = (
    process.env.FIREBASE_DATABASE_URL ||
    process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ||
    ""
  ).trim();

  return url ? url.replace(/\/+$/, "") : null;
}
