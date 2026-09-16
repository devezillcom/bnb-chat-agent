"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useT } from "next-i18next/client";

import { AgentModelField } from "@/components/agents/agent-model-field";
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
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import {
  createAgentFormSchema,
  type CreateAgentFormValues,
} from "@/lib/agents/schema";
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

  const form = useForm<CreateAgentFormValues>({
    resolver: zodResolver(createAgentFormSchema),
    defaultValues: {
      name: agent.name,
      description: agent.description ?? "",
      // Carried unchanged so the full PATCH payload stays valid; the system
      // prompt is edited on the Instructions page.
      systemPrompt: agent.systemPrompt,
      model: agent.model,
      firstMessage: agent.firstMessage ?? "",
    },
  });

  const isSubmitting = form.formState.isSubmitting;
  const nameError = form.formState.errors.name;
  const descriptionError = form.formState.errors.description;
  const firstMessageError = form.formState.errors.firstMessage;

  async function onSubmit(values: CreateAgentFormValues) {
    const res = await workspaceFetch(workspaceId, `/api/agents/${agent.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = (await res.json()) as { message?: string; error?: string };

    if (res.ok) {
      toast.add({ title: data.message ?? "Assistant updated.", type: "success" });
      form.reset(values);
      router.refresh();
      return;
    }

    toast.add({
      title: data.error ?? data.message ?? "Something went wrong.",
      type: "error",
    });
  }

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

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("agentDetail.general.sectionTitle")}</CardTitle>
            <CardDescription>
              {t("agentDetail.general.sectionDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field data-invalid={!!nameError || undefined}>
                <FieldLabel htmlFor="agent-name">
                  {t("agentDetail.general.name")}
                </FieldLabel>
                <Input
                  id="agent-name"
                  autoComplete="off"
                  aria-invalid={!!nameError}
                  disabled={isSubmitting}
                  {...form.register("name")}
                />
                <FieldError errors={[nameError]} />
              </Field>

              <Field data-invalid={!!descriptionError || undefined}>
                <FieldLabel htmlFor="agent-description">
                  {t("agentDetail.general.description")}
                </FieldLabel>
                <Input
                  id="agent-description"
                  autoComplete="off"
                  aria-invalid={!!descriptionError}
                  disabled={isSubmitting}
                  {...form.register("description")}
                />
                <FieldError errors={[descriptionError]} />
              </Field>

              <AgentModelField
                control={form.control}
                name="model"
                id="agent-model"
                disabled={isSubmitting}
              />
            </FieldGroup>
          </CardContent>
          <CardFooter className="justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting || !form.formState.isDirty}
              onClick={() => form.reset()}
            >
              {t("agentDetail.reset")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2Icon className="animate-spin" data-icon="inline-start" />
                  {t("agentDetail.saving")}
                </>
              ) : (
                t("agentDetail.save")
              )}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("agentDetail.general.firstMessageTitle")}</CardTitle>
            <CardDescription>
              {t("agentDetail.general.firstMessageDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Field data-invalid={!!firstMessageError || undefined}>
              <FieldLabel htmlFor="agent-first-message" className="sr-only">
                {t("agentDetail.general.firstMessageTitle")}
              </FieldLabel>
              <Textarea
                id="agent-first-message"
                rows={3}
                placeholder={t("agentDetail.general.firstMessagePlaceholder")}
                aria-invalid={!!firstMessageError}
                disabled={isSubmitting}
                {...form.register("firstMessage")}
              />
              <FieldError errors={[firstMessageError]} />
            </Field>
          </CardContent>
          <CardFooter className="justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting || !form.formState.isDirty}
              onClick={() => form.reset()}
            >
              {t("agentDetail.reset")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2Icon className="animate-spin" data-icon="inline-start" />
                  {t("agentDetail.saving")}
                </>
              ) : (
                t("agentDetail.save")
              )}
            </Button>
          </CardFooter>
        </Card>

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
      </form>
    </>
  );
}
