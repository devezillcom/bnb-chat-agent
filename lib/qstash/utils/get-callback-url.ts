export function getCallbackUrl() {
  const url =
    process.env.QSTASH_CALLBACK_URL ??
    (process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL}/api/qstash/callback`
      : undefined);

  if (!url) {
    throw new Error(
      "QSTASH_CALLBACK_URL or NEXT_PUBLIC_APP_URL environment variable must be set",
    );
  }

  return url;
}
