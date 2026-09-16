export const KNOWLEDGE_BASE_DOCUMENT_STATUS_LABELS: Record<string, string> = {
  pending_upload: "Pending upload",
  uploaded: "Uploaded",
  converting: "Converting",
  classifying: "Classifying",
  chunking: "Chunking",
  indexing: "Indexing",
  ready: "Ready",
  failed: "Failed",
};

export const KNOWLEDGE_BASE_DOCUMENT_STATUS_CLASSNAME: Record<string, string> = {
  ready: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  failed: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  indexing: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  chunking: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  classifying: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  converting: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  uploaded: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  pending_upload: "bg-muted text-muted-foreground",
};
