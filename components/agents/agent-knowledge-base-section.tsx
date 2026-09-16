"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2Icon, UploadIcon } from "lucide-react";
import { useRef, useState } from "react";
import { useT } from "next-i18next/client";

import { EditKnowledgeBaseDialog } from "@/components/knowledge-base/edit-knowledge-base-dialog";
import { KnowledgeBaseDocumentRow } from "@/components/knowledge-base/knowledge-base-document-row";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import type {
  AgentKnowledgeBaseItem,
  ListKnowledgeBaseDocumentsResult,
} from "@/lib/knowledge-base/types";
import { uploadKnowledgeBaseFile } from "@/lib/knowledge-base/utils/upload-knowledge-base-file";
import { workspaceFetch } from "@/lib/workspaces/utils/workspace-fetch";

type AgentKnowledgeBaseSectionProps = {
  workspaceId: string;
  workspaceIndex: number;
  knowledgeBase: AgentKnowledgeBaseItem;
  deleting: boolean;
  onDelete: () => void | Promise<void>;
};

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

export function AgentKnowledgeBaseSection({
  workspaceId,
  workspaceIndex,
  knowledgeBase,
  deleting,
  onDelete,
}: AgentKnowledgeBaseSectionProps) {
  const { t } = useT("dashboard");
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const documentsQueryKey = [
    "knowledge-base-documents",
    workspaceId,
    knowledgeBase.id,
  ];

  const documentsQuery = useQuery({
    queryKey: documentsQueryKey,
    queryFn: () => fetchDocuments(workspaceId, knowledgeBase.id),
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
        await uploadKnowledgeBaseFile(workspaceId, knowledgeBase.id, file);
      }
      toast.add({
        title:
          files.length === 1
            ? t("agentDetail.knowledge.uploadSuccessOne")
            : t("agentDetail.knowledge.uploadSuccessMany", {
                count: files.length,
              }),
        type: "success",
      });
      await queryClient.invalidateQueries({ queryKey: documentsQueryKey });
      await queryClient.invalidateQueries({
        queryKey: ["agent-knowledge-bases"],
      });
    } catch (error) {
      toast.add({
        title:
          error instanceof Error
            ? error.message
            : t("agentDetail.knowledge.uploadError"),
        type: "error",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  const documents = documentsQuery.data?.items ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{knowledgeBase.name}</CardTitle>
        {knowledgeBase.description ? (
          <CardDescription>{knowledgeBase.description}</CardDescription>
        ) : null}
        <CardAction className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(event) => void handleFilesSelected(event.target.files)}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || deleting}
          >
            {uploading ? (
              <>
                <Loader2Icon className="animate-spin" data-icon="inline-start" />
                {t("agentDetail.knowledge.uploading")}
              </>
            ) : (
              <>
                <UploadIcon data-icon="inline-start" />
                {t("agentDetail.knowledge.upload")}
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditOpen(true)}
            disabled={uploading || deleting}
          >
            {t("agentDetail.knowledge.edit")}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger
              render={
                <Button variant="destructive" size="sm" disabled={deleting || uploading} />
              }
            >
              {deleting ? (
                <>
                  <Loader2Icon className="animate-spin" data-icon="inline-start" />
                  {t("agentDetail.knowledge.deleting")}
                </>
              ) : (
                t("agentDetail.knowledge.delete")
              )}
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {t("agentDetail.knowledge.deleteConfirmTitle")}
                </AlertDialogTitle>
                <AlertDialogDescription className="space-y-2">
                  <span className="block">
                    {t("agentDetail.knowledge.deleteConfirmIntro", {
                      name: knowledgeBase.name,
                    })}
                  </span>
                  <span className="block font-medium text-destructive">
                    {t("agentDetail.knowledge.deleteConfirmDocuments", {
                      count: knowledgeBase.documentCount,
                    })}
                  </span>
                  <span className="block">
                    {t("agentDetail.knowledge.deleteConfirmAgents")}
                  </span>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={deleting}>
                  {t("agentDetail.cancel")}
                </AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  disabled={deleting}
                  onClick={onDelete}
                >
                  {deleting ? (
                    <>
                      <Loader2Icon
                        className="animate-spin"
                        data-icon="inline-start"
                      />
                      {t("agentDetail.knowledge.deleting")}
                    </>
                  ) : (
                    t("agentDetail.knowledge.deleteKnowledgeBase")
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardAction>
      </CardHeader>

      <CardContent>
        {documentsQuery.isLoading ? (
          <ul className="flex flex-col gap-2.5">
            {Array.from({ length: 2 }).map((_, index) => (
              <li key={index}>
                <Skeleton className="h-20 w-full rounded-xl" />
              </li>
            ))}
          </ul>
        ) : documentsQuery.error ? (
          <p className="text-sm text-destructive">
            {documentsQuery.error.message}
          </p>
        ) : documents.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card/50 px-6 py-8 text-center">
            <p className="font-medium">{t("agentDetail.knowledge.noDocuments")}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("agentDetail.knowledge.noDocumentsDescription")}
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {documents.map((document) => (
              <KnowledgeBaseDocumentRow
                key={document.id}
                workspaceId={workspaceId}
                workspaceIndex={workspaceIndex}
                knowledgeBaseId={knowledgeBase.id}
                document={document}
                onDeleted={() => {
                  void queryClient.invalidateQueries({
                    queryKey: documentsQueryKey,
                  });
                  void queryClient.invalidateQueries({
                    queryKey: ["agent-knowledge-bases"],
                  });
                }}
              />
            ))}
          </ul>
        )}
      </CardContent>

      <EditKnowledgeBaseDialog
        knowledgeBase={{
          id: knowledgeBase.id,
          name: knowledgeBase.name,
          description: knowledgeBase.description,
        }}
        workspaceId={workspaceId}
        open={editOpen}
        onOpenChange={setEditOpen}
        onUpdated={() =>
          queryClient.invalidateQueries({ queryKey: ["agent-knowledge-bases"] })
        }
      />
    </Card>
  );
}
