"use client";

import { Loader2Icon, PlusIcon } from "lucide-react";
import { useT } from "next-i18next/client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ToolRegistryListItem } from "@/lib/tools/types";

type AddAgentToolDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: ToolRegistryListItem[];
  isLoading: boolean;
  errorMessage?: string;
  onSelect: (registryToolId: string) => void;
};

export function AddAgentToolDialog({
  open,
  onOpenChange,
  items,
  isLoading,
  errorMessage,
  onSelect,
}: AddAgentToolDialogProps) {
  const { t } = useT("dashboard");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("agentDetail.tools.addDialogTitle")}</DialogTitle>
          <DialogDescription>
            {t("agentDetail.tools.addDialogDescription")}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[48vh] overflow-y-auto">
          {isLoading ? (
            <p className="py-4 text-sm text-muted-foreground">
              {t("agentDetail.tools.loadingAvailable")}
            </p>
          ) : errorMessage ? (
            <p className="py-4 text-sm text-destructive">{errorMessage}</p>
          ) : items.length === 0 ? (
            <p className="py-4 text-sm text-muted-foreground">
              {t("agentDetail.tools.noneAvailable")}
            </p>
          ) : (
            <ul className="flex flex-col gap-2 py-1">
              {items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelect(item.id);
                      onOpenChange(false);
                    }}
                    className="flex w-full items-start gap-3 rounded-lg border border-border p-3 text-left hover:bg-muted/50"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium">
                        {item.name}
                      </span>
                      <span className="block text-sm text-muted-foreground">
                        {item.description}
                      </span>
                      <code className="mt-1 block text-xs text-muted-foreground">
                        {item.id}
                      </code>
                    </span>
                    <PlusIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t("agentDetail.cancel")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
