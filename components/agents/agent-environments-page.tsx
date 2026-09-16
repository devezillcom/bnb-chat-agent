"use client";

import { SlidersHorizontalIcon } from "lucide-react";
import { useT } from "next-i18next/client";

import { AgentPageHelper } from "@/components/agents/agent-page-helper";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function AgentEnvironmentsPage() {
  const { t } = useT("dashboard");

  return (
    <>
      <AgentPageHelper
        title={t("agentDetail.environments.helperTitle")}
        description={t("agentDetail.environments.helperDescription")}
      />
      <Card>
        <CardHeader>
          <CardTitle>
            {t("agentDetail.environments.comingSoonTitle")}
          </CardTitle>
          <CardDescription>
            {t("agentDetail.environments.comingSoonDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-12 text-center text-muted-foreground">
            <SlidersHorizontalIcon className="size-8 opacity-50" />
            <p className="text-sm">
              {t("agentDetail.environments.comingSoonTitle")}
            </p>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
