import { FILE_EXTENSIONS } from "../file-extensions";

export function getExtensionFromMime(mime: string): string {
  const base = mime.trim().toLowerCase().split(";")[0]?.trim() ?? "";
  if (!base) return "bin";

  for (const [extWithDot, { mime: m }] of Object.entries(FILE_EXTENSIONS)) {
    if (m.toLowerCase() === base) {
      return extWithDot.slice(1);
    }
  }

  return "bin";
}
