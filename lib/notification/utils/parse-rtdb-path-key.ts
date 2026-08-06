import { APIError } from "@/lib/exposers/api-error";

const INVALID_SEGMENT = /[.#$\[\]/]/;
const MAX_PATH_KEY_LENGTH = 256;

export function parseRtdbPathKey(raw: string): string {
  const key = raw.trim();
  if (!key) {
    throw new APIError("ERR_INVALID_PATH_KEY", "path key cannot be empty", 400);
  }
  if (key.length > MAX_PATH_KEY_LENGTH) {
    throw new APIError("ERR_INVALID_PATH_KEY", "path key is too long", 400);
  }
  if (INVALID_SEGMENT.test(key)) {
    throw new APIError(
      "ERR_INVALID_PATH_KEY",
      "path key cannot contain . # $ [ ] or /",
      400,
    );
  }
  return key;
}

export function parseRtdbPath(raw: string): string {
  const trimmed = raw.trim().replace(/^\/+|\/+$/g, "");
  if (!trimmed) {
    throw new APIError("ERR_INVALID_PATH_KEY", "path cannot be empty", 400);
  }

  const segments = trimmed.split("/").filter((segment) => segment.length > 0);
  if (segments.length === 0) {
    throw new APIError("ERR_INVALID_PATH_KEY", "path cannot be empty", 400);
  }

  return segments.map((segment) => parseRtdbPathKey(segment)).join("/");
}
