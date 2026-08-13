"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeftIcon,
  Loader2Icon,
  Trash2Icon,
  UploadIcon,
} from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import { useJobStatusTracking } from "@/hooks/use-job-status-tracking";
import { getDashboardNavHref } from "@/lib/dashboard/nav-items";
import type {
  GetKnowledgeBaseResult,
  KnowledgeBaseDocumentListItem,
  ListKnowledgeBaseDocumentsResult,
} from "@/lib/knowledge-base/types";
import { cn } from "@/lib/utils";
import { workspaceFetch } from "@/lib/workspaces/utils/workspace-fetch";

type KnowledgeBaseDetailPageProps = {
  workspaceId: string;
  workspaceIndex: number;
  knowledgeBaseId: string;
};

const STATUS_LABELS: Record<string, string> = {
  pending_upload: "Pending upload",
  uploaded: "Uploaded",
  converting: "Converting",
  classifying: "Classifying",
  chunking: "Chunking",
  indexing: "Indexing",
  ready: "Ready",
  failed: "Failed",
};

const STATUS_CLASSNAME: Record<string, string> = {
  ready: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  failed: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  indexing: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  chunking: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  classifying: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  converting: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  uploaded: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  pending_upload: "bg-muted text-muted-foreground",
};

async function fetchKnowledgeBase(
  workspaceId: string,
  knowledgeBaseId: string,
): Promise<GetKnowledgeBaseResult> {
  const res = await workspaceFetch(
    workspaceId,
    `/api/knowledge-bases/${knowledgeBaseId}`,
  );
  const data = (await res.json()) as GetKnowledgeBaseResult & {
    error?: string;
    message?: string;
  };

  if (!res.ok) {
    throw new Error(data.message ?? data.error ?? "Could not load knowledge base.");
  }

  return data;
}

async function fetchDocuments(
  workspaceId: string,
  knowledgeBaseId: string,
): Promise<ListKnowledgeBaseDocumentsResult> {
  const res = await workspaceFetch(
    workspaceId,
    `/api/knowledge-bases/${knowledgeBaseId}/documents?limit=100`,
  );
  const data = (await res.json()) as ListKnowledgeBaseDocumentsResult & {
    error?: string;
    message?: string;
  };

  if (!res.ok) {
    throw new Error(data.message ?? data.error ?? "Could not load documents.");
  }

  return data;
}

function DocumentStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium",
        STATUS_CLASSNAME[status] ?? "bg-muted text-muted-foreground",
      )}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

function getKnowledgeBaseDocumentViewHref(
  workspaceIndex: number,
  knowledgeBaseId: string,
  documentId: string,
): string {
  return `/w/${workspaceIndex}/knowledge-base/${knowledgeBaseId}/documents/${documentId}/view`;
}

function DocumentRow({
  workspaceId,
  workspaceIndex,
  knowledgeBaseId,
  document,
  onDeleted,
}: {
  workspaceId: string;
  workspaceIndex: number;
  knowledgeBaseId: string;
  document: KnowledgeBaseDocumentListItem;
  onDeleted: () => void;
}) {
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

export function KnowledgeBaseDetailPage({
  workspaceId,
  workspaceIndex,
  knowledgeBaseId,
}: KnowledgeBaseDetailPageProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const listHref = getDashboardNavHref(workspaceIndex, "knowledge-base");

  const knowledgeBaseQuery = useQuery({
    queryKey: ["knowledge-base", workspaceId, knowledgeBaseId],
    queryFn: () => fetchKnowledgeBase(workspaceId, knowledgeBaseId),
  });

  const documentsQuery = useQuery({
    queryKey: ["knowledge-base-documents", workspaceId, knowledgeBaseId],
    queryFn: () => fetchDocuments(workspaceId, knowledgeBaseId),
    refetchInterval: (query) => {
      const items = query.state.data?.items ?? [];
      const hasActive = items.some(
        (item) => item.status !== "ready" && item.status !== "failed",
      );
      return hasActive ? 4000 : false;
    },
  });

  async function uploadFile(file: File) {
    const uploadUrlRes = await workspaceFetch(
      workspaceId,
      `/api/knowledge-bases/${knowledgeBaseId}/documents/upload-url`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type || "application/octet-stream",
          contentLength: file.size,
        }),
      },
    );
    const uploadUrlData = (await uploadUrlRes.json()) as {
      uploadUrl?: string;
      key?: string;
      error?: string;
      message?: string;
    };

    if (!uploadUrlRes.ok || !uploadUrlData.uploadUrl || !uploadUrlData.key) {
      throw new Error(
        uploadUrlData.message ??
          uploadUrlData.error ??
          `Could not prepare upload for ${file.name}.`,
      );
    }

    const putRes = await fetch(uploadUrlData.uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": file.type || "application/octet-stream",
      },
      body: file,
    });

    if (!putRes.ok) {
      throw new Error(`Upload failed for ${file.name}.`);
    }

    const createRes = await workspaceFetch(
      workspaceId,
      `/api/knowledge-bases/${knowledgeBaseId}/documents`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: uploadUrlData.key,
          filename: file.name,
          contentType: file.type || "application/octet-stream",
          contentLength: file.size,
        }),
      },
    );
    const createData = (await createRes.json()) as {
      message?: string;
      error?: string;
    };

    if (!createRes.ok) {
      throw new Error(
        createData.message ??
          createData.error ??
          `Could not queue processing for ${file.name}.`,
      );
    }
  }

  async function handleFilesSelected(files: FileList | null) {
    if (!files || files.length === 0) {
      return;
    }

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        await uploadFile(file);
      }
      toast.add({
        title:
          files.length === 1
            ? "Document uploaded. Processing started."
            : `${files.length} documents uploaded. Processing started.`,
        type: "success",
      });
      await queryClient.invalidateQueries({
        queryKey: ["knowledge-base-documents", workspaceId, knowledgeBaseId],
      });
      await queryClient.invalidateQueries({
        queryKey: ["knowledge-base", workspaceId, knowledgeBaseId],
      });
    } catch (error) {
      toast.add({
        title: error instanceof Error ? error.message : "Upload failed.",
        type: "error",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  const knowledgeBase = knowledgeBaseQuery.data;
  const documents = documentsQuery.data?.items ?? [];

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 md:px-8">
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={<Link href={listHref} />}
          className="mb-4 -ml-2"
        >
          <ArrowLeftIcon data-icon="inline-start" />
          Knowledge bases
        </Button>

        {knowledgeBaseQuery.isLoading ? (
          <Skeleton className="h-8 w-64" />
        ) : knowledgeBase ? (
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">
              {knowledgeBase.name}
            </h1>
            {knowledgeBase.description ? (
              <p className="text-sm text-muted-foreground">
                {knowledgeBase.description}
              </p>
            ) : null}
            <p className="text-xs text-muted-foreground">
              {knowledgeBase.documentCount}{" "}
              {knowledgeBase.documentCount === 1 ? "document" : "documents"}
            </p>
          </div>
        ) : (
          <p className="text-sm text-destructive">
            {knowledgeBaseQuery.error?.message ?? "Knowledge base not found."}
          </p>
        )}
      </div>

      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-sm font-medium">Documents</h2>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(event) => void handleFilesSelected(event.target.files)}
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || knowledgeBaseQuery.isLoading}
          >
            {uploading ? (
              <>
                <Loader2Icon className="size-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <UploadIcon data-icon="inline-start" />
                Upload documents
              </>
            )}
          </Button>
        </div>
      </div>

      {documentsQuery.isLoading ? (
        <ul className="flex flex-col gap-2.5">
          {Array.from({ length: 3 }).map((_, index) => (
            <li key={index}>
              <Skeleton className="h-20 w-full rounded-xl" />
            </li>
          ))}
        </ul>
      ) : documents.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/50 px-6 py-12 text-center">
          <p className="font-medium">No documents yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Upload PDF, Word, Excel, PowerPoint, CSV, EPUB, RTF, or Markdown files
            up to 50 MB.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {documents.map((document) => (
            <DocumentRow
              key={document.id}
              workspaceId={workspaceId}
              workspaceIndex={workspaceIndex}
              knowledgeBaseId={knowledgeBaseId}
              document={document}
              onDeleted={() => {
                void queryClient.invalidateQueries({
                  queryKey: [
                    "knowledge-base-documents",
                    workspaceId,
                    knowledgeBaseId,
                  ],
                });
                void queryClient.invalidateQueries({
                  queryKey: ["knowledge-base", workspaceId, knowledgeBaseId],
                });
              }}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
