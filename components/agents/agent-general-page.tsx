"use client";

import { Loader2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useT } from "next-i18next/client";

import { AgentBasicsForm } from "@/components/agents/agent-basics-form";
import { AgentGreetingForm } from "@/components/agents/agent-greeting-form";
import { AgentPageHelper } from "@/components/agents/agent-page-helper";
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
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "@/components/ui/toast";
import type { AgentListItem } from "@/lib/agents/types";
import { getDashboardNavHref } from "@/lib/dashboard/nav-items";
import { workspaceFetch } from "@/lib/workspaces/utils/workspace-fetch";

type AgentGeneralPageProps = {
  agent: AgentListItem;
  workspaceId: string;
  workspaceIndex: number;
};

export function AgentGeneralPage({
  agent,
  workspaceId,
  workspaceIndex,
}: AgentGeneralPageProps) {
  const router = useRouter();
  const { t } = useT("dashboard");
  const agentsHref = getDashboardNavHref(workspaceIndex, "agents");

  const [clearContextOpen, setClearContextOpen] = useState(false);
  const [clearingContext, setClearingContext] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleClearContext() {
    setClearingContext(true);

    try {
      const res = await workspaceFetch(
        workspaceId,
        `/api/agents/${agent.id}/chat-context`,
        { method: "DELETE" },
      );
      const data = (await res.json()) as { message?: string; error?: string };

      if (!res.ok) {
        toast.add({
          title: data.message ?? data.error ?? "Could not clear chat context.",
          type: "error",
        });
        return;
      }

      toast.add({
        title: data.message ?? "Chat context cleared.",
        type: "success",
      });
      setClearContextOpen(false);
    } finally {
      setClearingContext(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);

    try {
      const res = await workspaceFetch(workspaceId, `/api/agents/${agent.id}`, {
        method: "DELETE",
      });
      const data = (await res.json()) as { message?: string; error?: string };

      if (!res.ok) {
        toast.add({
          title: data.message ?? data.error ?? "Could not delete assistant.",
          type: "error",
        });
        return;
      }

      toast.add({ title: data.message ?? "Assistant deleted.", type: "success" });
      setDeleteOpen(false);
      router.push(agentsHref);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <AgentPageHelper
        title={t("agentDetail.general.helperTitle")}
        description={t("agentDetail.general.helperDescription")}
      />

      <div className="space-y-6">
        <AgentBasicsForm agent={agent} workspaceId={workspaceId} />
        <AgentGreetingForm agent={agent} workspaceId={workspaceId} />

        <Card>
          <CardHeader>
            <CardTitle>{t("agentDetail.general.clearContextTitle")}</CardTitle>
            <CardDescription>
              {t("agentDetail.general.clearContextDescription")}
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-end">
            <AlertDialog
              open={clearContextOpen}
              onOpenChange={setClearContextOpen}
            >
              <AlertDialogTrigger
                render={<Button variant="outline" disabled={clearingContext} />}
              >
                {t("agentDetail.general.clearContextButton")}
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {t("agentDetail.general.clearContextConfirmTitle")}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {t("agentDetail.general.clearContextConfirmDescription", {
                      name: agent.name,
                    })}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={clearingContext}>
                    {t("agentDetail.cancel")}
                  </AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    disabled={clearingContext}
                    onClick={handleClearContext}
                  >
                    {clearingContext ? (
                      <>
                        <Loader2Icon
                          className="animate-spin"
                          data-icon="inline-start"
                        />
                        {t("agentDetail.general.clearing")}
                      </>
                    ) : (
                      t("agentDetail.general.clearContextButton")
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardFooter>
        </Card>

        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle>{t("agentDetail.general.dangerTitle")}</CardTitle>
            <CardDescription>
              {t("agentDetail.general.dangerDescription")}
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-end">
            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
              <AlertDialogTrigger
                render={<Button variant="destructive" disabled={deleting} />}
              >
                {t("agentDetail.general.deleteButton")}
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {t("agentDetail.general.deleteConfirmTitle")}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {t("agentDetail.general.deleteConfirmDescription", {
                      name: agent.name,
                    })}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={deleting}>
                    {t("agentDetail.cancel")}
                  </AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    disabled={deleting}
                    onClick={handleDelete}
                  >
                    {deleting ? (
                      <>
                        <Loader2Icon
                          className="animate-spin"
                          data-icon="inline-start"
                        />
                        {t("agentDetail.general.deleting")}
                      </>
                    ) : (
                      t("agentDetail.general.deleteButton")
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardFooter>
        </Card>
      </div>
    </>
  );
}
