"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeftIcon, Loader2Icon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useT } from "next-i18next/client";
import { Controller, useForm } from "react-hook-form";

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
import { toast } from "@/components/ui/toast";
import type { ListAgentsResult } from "@/lib/agents/types";
import {
  websiteConnectionFormSchema,
  type WebsiteConnectionFormValues,
} from "@/lib/connections/schema";
import { getDashboardNavHref } from "@/lib/dashboard/nav-items";
import { workspaceFetch } from "@/lib/workspaces/utils/workspace-fetch";

type ConnectWebsitePageProps = {
  workspaceId: string;
  workspaceIndex: number;
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

export function ConnectWebsitePage({
  workspaceId,
  workspaceIndex,
}: ConnectWebsitePageProps) {
  const { t } = useT("dashboard");
  const router = useRouter();
  const connectionsHref = getDashboardNavHref(workspaceIndex, "connections");
  const agentsHref = getDashboardNavHref(workspaceIndex, "agents");

  const { data: agentsData, isLoading: isLoadingAgents } = useQuery({
    queryKey: ["agents", workspaceId],
    queryFn: () => fetchAgents(workspaceId),
  });

  const agents = agentsData?.items ?? [];

  const form = useForm<WebsiteConnectionFormValues>({
    resolver: zodResolver(websiteConnectionFormSchema),
    defaultValues: {
      name: "",
      websiteUrl: "",
      agentId: "",
    },
  });

  async function onSubmit(values: WebsiteConnectionFormValues) {
    const res = await workspaceFetch(workspaceId, "/api/connections/connect/website", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = (await res.json()) as {
      id?: string;
      message?: string;
      error?: string;
    };

    if (res.ok && data.id) {
      toast.add({
        title: data.message ?? t("websiteConnection.created"),
        type: "success",
      });
      router.push(`${connectionsHref}/${data.id}`);
      return;
    }

    toast.add({
      title: data.message ?? data.error ?? t("websiteConnection.createFailed"),
      type: "error",
    });
  }

  const isSubmitting = form.formState.isSubmitting;
  const nameError = form.formState.errors.name;
  const websiteUrlError = form.formState.errors.websiteUrl;
  const agentIdError = form.formState.errors.agentId;
  const hasAgents = agents.length > 0;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 md:px-8">
      <div className="mb-6 space-y-4">
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={<Link href={connectionsHref} />}
        >
          <ArrowLeftIcon data-icon="inline-start" />
          {t("websiteConnection.back")}
        </Button>
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("websiteConnection.createTitle")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("websiteConnection.createDescription")}
          </p>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>{t("websiteConnection.infoTitle")}</CardTitle>
            <CardDescription>
              {t("websiteConnection.createInfoDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field data-invalid={!!nameError || undefined}>
                <FieldLabel htmlFor="website-name">
                  {t("websiteConnection.nameLabel")}
                </FieldLabel>
                <Input
                  id="website-name"
                  autoComplete="off"
                  placeholder={t("websiteConnection.namePlaceholder")}
                  aria-invalid={!!nameError}
                  disabled={isSubmitting}
                  {...form.register("name")}
                />
                <FieldError errors={[nameError]} />
              </Field>

              <Field data-invalid={!!websiteUrlError || undefined}>
                <FieldLabel htmlFor="website-url">
                  {t("websiteConnection.urlLabel")}
                </FieldLabel>
                <FieldDescription>
                  {t("websiteConnection.urlDescription")}
                </FieldDescription>
                <Input
                  id="website-url"
                  type="url"
                  inputMode="url"
                  autoComplete="url"
                  placeholder={t("websiteConnection.urlPlaceholder")}
                  aria-invalid={!!websiteUrlError}
                  disabled={isSubmitting}
                  {...form.register("websiteUrl")}
                />
                <FieldError errors={[websiteUrlError]} />
              </Field>

              <Field data-invalid={!!agentIdError || undefined}>
                <FieldLabel htmlFor="website-agent">
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
                      disabled={isSubmitting || isLoadingAgents || !hasAgents}
                    >
                      <SelectTrigger
                        id="website-agent"
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
                          {agents.map((agent) => (
                            <SelectItem key={agent.id} value={agent.id}>
                              {agent.name}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldError errors={[agentIdError]} />
                {!isLoadingAgents && !hasAgents ? (
                  <p className="text-sm text-muted-foreground">
                    {t("websiteConnection.agentEmpty")}{" "}
                    <Link href={`${agentsHref}/new`} className="text-primary hover:underline">
                      {t("websiteConnection.createAgent")}
                    </Link>
                  </p>
                ) : null}
              </Field>
            </FieldGroup>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmitting || isLoadingAgents || !hasAgents}>
              {isSubmitting ? <Loader2Icon className="animate-spin" /> : null}
              {isSubmitting
                ? t("websiteConnection.creating")
                : t("websiteConnection.createSubmit")}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
