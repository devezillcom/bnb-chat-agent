"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CopyIcon, ExternalLinkIcon, Loader2Icon, TrashIcon } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useT } from "next-i18next/client";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/toast";
import type { ListAgentsResult } from "@/lib/agents/types";
import { buildWebsiteEmbedCode } from "@/lib/connections/utils/build-website-embed-code";
import { normalizeWebsiteUrl } from "@/lib/connections/utils/normalize-website-url";
import { readWebsiteConnectionMetadata } from "@/lib/connections/utils/read-website-connection-metadata";
import {
  websiteConnectionFormSchema,
  type WebsiteConnectionFormValues,
} from "@/lib/connections/schema";
import type { ConnectionDetail } from "@/lib/connections/types";
import { getConnectionTypeLabel } from "@/lib/connections/utils/connection-display-utils";
import { getSiteBaseUrl } from "@/lib/common/get-site-base-url";
import { getDashboardNavHref } from "@/lib/dashboard/nav-items";
import { workspaceFetch } from "@/lib/workspaces/utils/workspace-fetch";

type WebsiteConnectionDetailProps = {
  workspaceId: string;
  workspaceIndex: number;
  connectionId: string;
  initialConnection: ConnectionDetail;
};

async function fetchAgents(workspaceId: string): Promise<ListAgentsResult> {
  const res = await workspaceFetch(workspaceId, "/api/agents?limit=100");
  const data = (await res.json()) as ListAgentsResult & {
    error?: string;
    message?: string;
  };

  if (!res.ok) {
    throw new Error(data.message ?? data.error ?? "Could not load agents.");
  }

  return data;
}

function CopyBlock({
  label,
  value,
  copiedLabel,
  failedLabel,
}: {
  label: string;
  value: string;
  copiedLabel: string;
  failedLabel: string;
}) {
  async function onCopy() {
    try {
      await navigator.clipboard.writeText(value);
      toast.add({ title: copiedLabel, type: "success" });
    } catch {
      toast.add({ title: failedLabel, type: "error" });
    }
  }

  return (
    <div className="space-y-3">
      <pre className="overflow-x-auto rounded-lg bg-muted p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap">
        <code>{value}</code>
      </pre>
      <Button type="button" variant="outline" size="sm" onClick={() => void onCopy()}>
        <CopyIcon data-icon="inline-start" />
        {label}
      </Button>
    </div>
  );
}

export function WebsiteConnectionDetail({
  workspaceId,
  workspaceIndex,
  connectionId,
  initialConnection,
}: WebsiteConnectionDetailProps) {
  const { t } = useT("dashboard");
  const queryClient = useQueryClient();
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const connectionsPath = getDashboardNavHref(workspaceIndex, "connections");
  const agentsHref = getDashboardNavHref(workspaceIndex, "agents");

  const { data: connection = initialConnection } = useQuery({
    queryKey: ["connection", workspaceId, connectionId],
    queryFn: async () => {
      const res = await workspaceFetch(
        workspaceId,
        `/api/connections/${connectionId}`,
      );
      const data = (await res.json()) as ConnectionDetail & {
        error?: string;
        message?: string;
      };

      if (!res.ok) {
        throw new Error(data.message ?? data.error ?? "Could not load connection.");
      }

      return data;
    },
    initialData: initialConnection,
  });

  const { data: agentsData, isLoading: isLoadingAgents } = useQuery({
    queryKey: ["agents", workspaceId],
    queryFn: () => fetchAgents(workspaceId),
  });

  const metadata = readWebsiteConnectionMetadata(connection.metadata);
  const agents = agentsData?.items ?? [];
  const agentOptions =
    connection.agent && !agents.some((agent) => agent.id === connection.agent?.id)
      ? [connection.agent, ...agents]
      : agents;

  const form = useForm<WebsiteConnectionFormValues>({
    resolver: zodResolver(websiteConnectionFormSchema),
    defaultValues: {
      name: connection.name,
      websiteUrl: metadata?.website_url ?? "",
      agentId: connection.agent?.id ?? "",
    },
  });

  const websiteUrlValue = useWatch({ control: form.control, name: "websiteUrl" });
  const allowedOriginPreview = React.useMemo(() => {
    try {
      return normalizeWebsiteUrl(websiteUrlValue || "").allowedOrigin;
    } catch {
      return metadata?.allowed_origin ?? null;
    }
  }, [metadata?.allowed_origin, websiteUrlValue]);

  const embedCode = React.useMemo(() => {
    if (!metadata || !connection.publicKey) {
      return null;
    }

    return buildWebsiteEmbedCode({
      siteBaseUrl: getSiteBaseUrl(),
      publicKey: connection.publicKey,
      allowedOrigin: metadata.allowed_origin,
      websiteName: connection.name,
    });
  }, [connection.name, connection.publicKey, metadata]);

  const saveMutation = useMutation({
    mutationFn: async (values: WebsiteConnectionFormValues) => {
      const res = await workspaceFetch(
        workspaceId,
        `/api/connections/${connectionId}`,
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(values),
        },
      );
      const data = (await res.json()) as { message?: string; error?: string };

      if (!res.ok) {
        throw new Error(data.message ?? data.error ?? t("websiteConnection.saveFailed"));
      }

      return { data, values };
    },
    onSuccess: ({ data, values }) => {
      let websiteUrl = values.websiteUrl;
      try {
        websiteUrl = normalizeWebsiteUrl(values.websiteUrl).websiteUrl;
      } catch {
        websiteUrl = values.websiteUrl;
      }

      form.reset({
        name: values.name.trim(),
        websiteUrl,
        agentId: values.agentId,
      });
      toast.add({
        title: data.message ?? t("websiteConnection.saved"),
        type: "success",
      });
      void queryClient.invalidateQueries({
        queryKey: ["connection", workspaceId, connectionId],
      });
      void queryClient.invalidateQueries({ queryKey: ["connections", workspaceId] });
    },
    onError: (error) => {
      toast.add({
        title: error instanceof Error ? error.message : t("websiteConnection.saveFailed"),
        type: "error",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await workspaceFetch(
        workspaceId,
        `/api/connections/${connectionId}`,
        { method: "DELETE" },
      );
      const data = (await res.json()) as { message?: string; error?: string };

      if (!res.ok) {
        throw new Error(data.message ?? data.error ?? t("websiteConnection.deleteFailed"));
      }

      return data;
    },
    onSuccess: () => {
      toast.add({
        title: t("websiteConnection.deleted"),
        type: "success",
      });
      window.location.href = connectionsPath;
    },
    onError: (error) => {
      toast.add({
        title:
          error instanceof Error ? error.message : t("websiteConnection.deleteFailed"),
        type: "error",
      });
    },
  });

  const nameError = form.formState.errors.name;
  const websiteUrlError = form.formState.errors.websiteUrl;
  const agentIdError = form.formState.errors.agentId;
  const isSaving = saveMutation.isPending;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-8 md:px-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <p className="text-xs text-muted-foreground">
            {getConnectionTypeLabel(connection.channelType)}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">{connection.name}</h1>
          {metadata ? (
            <a
              href={metadata.website_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
            >
              {metadata.website_url}
              <ExternalLinkIcon className="size-3.5" />
            </a>
          ) : null}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowDeleteDialog(true)}
        >
          <TrashIcon />
          {t("websiteConnection.delete")}
        </Button>
      </div>

      <form onSubmit={form.handleSubmit((values) => saveMutation.mutate(values))}>
        <Card>
          <CardHeader>
            <CardTitle>{t("websiteConnection.infoTitle")}</CardTitle>
            <CardDescription>
              {t("websiteConnection.infoDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field data-invalid={!!nameError || undefined}>
                <FieldLabel htmlFor="website-detail-name">
                  {t("websiteConnection.nameLabel")}
                </FieldLabel>
                <Input
                  id="website-detail-name"
                  autoComplete="off"
                  aria-invalid={!!nameError}
                  disabled={isSaving}
                  {...form.register("name")}
                />
                <FieldError errors={[nameError]} />
              </Field>

              <Field data-invalid={!!websiteUrlError || undefined}>
                <FieldLabel htmlFor="website-detail-url">
                  {t("websiteConnection.urlLabel")}
                </FieldLabel>
                <FieldDescription>
                  {t("websiteConnection.urlDescription")}
                </FieldDescription>
                <Input
                  id="website-detail-url"
                  type="url"
                  inputMode="url"
                  autoComplete="url"
                  aria-invalid={!!websiteUrlError}
                  disabled={isSaving}
                  {...form.register("websiteUrl")}
                />
                {allowedOriginPreview ? (
                  <p className="text-xs text-muted-foreground">
                    {t("websiteConnection.allowedOrigin", {
                      origin: allowedOriginPreview,
                    })}
                  </p>
                ) : null}
                <FieldError errors={[websiteUrlError]} />
              </Field>

              <Field data-invalid={!!agentIdError || undefined}>
                <FieldLabel htmlFor="website-detail-agent">
                  {t("websiteConnection.agentLabel")}
                </FieldLabel>
                <FieldDescription>
                  {t("websiteConnection.agentDescription")}
                </FieldDescription>
                <Controller
                  control={form.control}
                  name="agentId"
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={(nextValue) => {
                        if (nextValue) {
                          field.onChange(nextValue);
                        }
                      }}
                      disabled={isSaving || isLoadingAgents || agentOptions.length === 0}
                    >
                      <SelectTrigger
                        id="website-detail-agent"
                        className="w-full"
                        aria-invalid={!!agentIdError || undefined}
                        onBlur={field.onBlur}
                      >
                        <SelectValue
                          placeholder={t("websiteConnection.agentPlaceholder")}
                        />
                      </SelectTrigger>
                      <SelectContent align="start">
                        <SelectGroup>
                          {agentOptions.map((agent) => (
                            <SelectItem key={agent.id} value={agent.id}>
                              {agent.name}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  )}
                />
                {connection.agent ? (
                  <Link
                    href={`${agentsHref}/${connection.agent.id}`}
                    className="text-sm text-primary hover:underline"
                  >
                    {t("websiteConnection.openAgent", {
                      name: connection.agent.name,
                    })}
                  </Link>
                ) : null}
                <FieldError errors={[agentIdError]} />
              </Field>
            </FieldGroup>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSaving || !form.formState.isDirty}>
              {isSaving ? <Loader2Icon className="animate-spin" /> : null}
              {isSaving ? t("websiteConnection.saving") : t("websiteConnection.save")}
            </Button>
          </CardFooter>
        </Card>
      </form>

      <Card>
        <CardHeader>
          <CardTitle>{t("websiteConnection.embedTitle")}</CardTitle>
          <CardDescription>{t("websiteConnection.embedDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          {embedCode ? (
            <Tabs defaultValue="inline">
              <TabsList>
                <TabsTrigger value="inline">
                  {t("websiteConnection.inlineTab")}
                </TabsTrigger>
                <TabsTrigger value="popup">
                  {t("websiteConnection.popupTab")}
                </TabsTrigger>
              </TabsList>
              <TabsContent value="inline" className="space-y-3 pt-4">
                <p className="text-sm text-muted-foreground">
                  {t("websiteConnection.inlineHelp")}
                </p>
                <CopyBlock
                  label={t("websiteConnection.copyCode")}
                  value={embedCode.inline}
                  copiedLabel={t("websiteConnection.copied")}
                  failedLabel={t("websiteConnection.copyFailed")}
                />
              </TabsContent>
              <TabsContent value="popup" className="space-y-3 pt-4">
                <p className="text-sm text-muted-foreground">
                  {t("websiteConnection.popupHelp")}
                </p>
                <CopyBlock
                  label={t("websiteConnection.copyCode")}
                  value={embedCode.popup}
                  copiedLabel={t("websiteConnection.copied")}
                  failedLabel={t("websiteConnection.copyFailed")}
                />
              </TabsContent>
            </Tabs>
          ) : (
            <p className="text-sm text-destructive">
              {t("websiteConnection.missingEmbed")}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("websiteConnection.promptTitle")}</CardTitle>
          <CardDescription>{t("websiteConnection.promptDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          {embedCode ? (
            <CopyBlock
              label={t("websiteConnection.copyPrompt")}
              value={embedCode.codingAgentPrompt}
              copiedLabel={t("websiteConnection.copied")}
              failedLabel={t("websiteConnection.copyFailed")}
            />
          ) : (
            <p className="text-sm text-destructive">
              {t("websiteConnection.missingEmbed")}
            </p>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("websiteConnection.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("websiteConnection.deleteDescription", { name: connection.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              {t("websiteConnection.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate()}
            >
              {deleteMutation.isPending
                ? t("websiteConnection.deleting")
                : t("websiteConnection.deleteConfirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
