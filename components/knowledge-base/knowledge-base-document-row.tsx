"use client";

import { Loader2Icon, Trash2Icon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { useJobStatusTracking } from "@/hooks/use-job-status-tracking";
import type { KnowledgeBaseDocumentListItem } from "@/lib/knowledge-base/types";
import { getKnowledgeBaseDocumentViewHref } from "@/lib/knowledge-base/utils/get-knowledge-base-document-view-href";
import {
  KNOWLEDGE_BASE_DOCUMENT_STATUS_CLASSNAME,
  KNOWLEDGE_BASE_DOCUMENT_STATUS_LABELS,
} from "@/lib/knowledge-base/utils/knowledge-base-document-status";
import { cn } from "@/lib/utils";
import { workspaceFetch } from "@/lib/workspaces/utils/workspace-fetch";

function DocumentStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium",
        KNOWLEDGE_BASE_DOCUMENT_STATUS_CLASSNAME[status] ??
          "bg-muted text-muted-foreground",
      )}
    >
      {KNOWLEDGE_BASE_DOCUMENT_STATUS_LABELS[status] ?? status}
    </span>
  );
}

type KnowledgeBaseDocumentRowProps = {
  workspaceId: string;
  workspaceIndex: number;
  knowledgeBaseId: string;
  document: KnowledgeBaseDocumentListItem;
  onDeleted: () => void;
};

export function KnowledgeBaseDocumentRow({
  workspaceId,
  workspaceIndex,
  knowledgeBaseId,
  document,
  onDeleted,
}: KnowledgeBaseDocumentRowProps) {
  const [deleting, setDeleting] = useState(false);
  const { job } = useJobStatusTracking(document.jobKey);
  const liveStatus =
    typeof job?.payload?.status === "string"
      ? String(job.payload.status)
      : document.status;
  const liveStage =
    typeof job?.payload?.stage === "string" ? String(job.payload.stage) : null;

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await workspaceFetch(
        workspaceId,
        `/api/knowledge-bases/${knowledgeBaseId}/documents/${document.id}`,
        { method: "DELETE" },
      );
      const data = (await res.json()) as { message?: string; error?: string };
      if (!res.ok) {
        toast.add({
          title: data.error ?? data.message ?? "Could not delete document.",
          type: "error",
        });
        return;
      }
      toast.add({
        title: data.message ?? "Document deleted.",
        type: "success",
      });
      onDeleted();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <li className="rounded-xl border border-border/50 bg-card px-4 py-3.5 sm:px-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {document.status === "pending_upload" ? (
              <p className="truncate font-medium">{document.filename}</p>
            ) : (
              <a
                href={getKnowledgeBaseDocumentViewHref(
                  workspaceIndex,
                  knowledgeBaseId,
                  document.id,
                )}
                target="_blank"
                rel="noreferrer"
                className="truncate font-medium hover:text-primary hover:underline"
              >
                {document.filename}
              </a>
            )}
            <DocumentStatusBadge status={liveStatus} />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {document.contentType} · {(document.sizeBytes / 1024).toFixed(1)} KB
            {document.chunkCount != null ? ` · ${document.chunkCount} chunks` : ""}
          </p>
          {liveStage && liveStatus !== "ready" && liveStatus !== "failed" ? (
            <p className="mt-1 text-xs text-muted-foreground">
              Stage: {liveStage}
            </p>
          ) : null}
          {document.errorMessage ? (
            <p className="mt-1 text-xs text-destructive">{document.errorMessage}</p>
          ) : null}
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => void handleDelete()}
          disabled={deleting}
          aria-label={`Delete ${document.filename}`}
        >
          {deleting ? (
            <Loader2Icon className="size-4 animate-spin" />
          ) : (
            <Trash2Icon className="size-4" />
          )}
        </Button>
      </div>
    </li>
  );
}
