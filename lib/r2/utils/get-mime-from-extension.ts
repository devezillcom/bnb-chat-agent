import { FILE_EXTENSIONS } from "../file-extensions";

export function getMimeFromExtension(extension: string): string {
  const raw = extension.trim().toLowerCase();
  if (!raw) return "application/octet-stream";
  const withDot = raw.startsWith(".") ? raw : `.${raw}`;
  const entry = FILE_EXTENSIONS[withDot as keyof typeof FILE_EXTENSIONS];
  return entry?.mime ?? "application/octet-stream";
}
