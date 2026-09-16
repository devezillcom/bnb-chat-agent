"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeftIcon, Loader2Icon, UploadIcon } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";

import { KnowledgeBaseDocumentRow } from "@/components/knowledge-base/knowledge-base-document-row";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import { getDashboardNavHref } from "@/lib/dashboard/nav-items";
import type {
  GetKnowledgeBaseResult,
  ListKnowledgeBaseDocumentsResult,
} from "@/lib/knowledge-base/types";
import { uploadKnowledgeBaseFile } from "@/lib/knowledge-base/utils/upload-knowledge-base-file";
import { workspaceFetch } from "@/lib/workspaces/utils/workspace-fetch";

type KnowledgeBaseDetailPageProps = {
  workspaceId: string;
  workspaceIndex: number;
  knowledgeBaseId: string;
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

  async function handleFilesSelected(files: FileList | null) {
    if (!files || files.length === 0) {
      return;
    }

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        await uploadKnowledgeBaseFile(workspaceId, knowledgeBaseId, file);
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
            <KnowledgeBaseDocumentRow
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
