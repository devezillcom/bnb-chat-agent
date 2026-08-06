export const FILE_EXTENSIONS = {
  ".jpg": { mime: "image/jpeg", type: "image" },
  ".jpeg": { mime: "image/jpeg", type: "image" },
  ".png": { mime: "image/png", type: "image" },
  ".webp": { mime: "image/webp", type: "image" },
  ".gif": { mime: "image/gif", type: "image" },
  ".pdf": { mime: "application/pdf", type: "document" },
  ".txt": { mime: "text/plain", type: "document" },
  ".md": { mime: "text/markdown", type: "document" },
  ".bin": { mime: "application/octet-stream", type: "binary" },
} as const;
