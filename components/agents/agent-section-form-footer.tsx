"use client";

import { Loader2Icon } from "lucide-react";
import { useT } from "next-i18next/client";

import { Button } from "@/components/ui/button";
import { CardFooter } from "@/components/ui/card";

type AgentSectionFormFooterProps = {
  isSubmitting: boolean;
  isDirty: boolean;
  disabled?: boolean;
  onReset: () => void;
};

export function AgentSectionFormFooter({
  isSubmitting,
  isDirty,
  disabled = false,
  onReset,
}: AgentSectionFormFooterProps) {
  const { t } = useT("dashboard");
  const isBusy = isSubmitting || disabled;

  return (
    <CardFooter className="justify-end gap-2">
      <Button
        type="button"
        variant="outline"
        disabled={isBusy || !isDirty}
        onClick={onReset}
      >
        {t("agentDetail.reset")}
      </Button>
      <Button type="submit" disabled={isBusy}>
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
  );
}
