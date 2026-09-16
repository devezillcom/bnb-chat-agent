"use client";

import { CheckIcon } from "lucide-react";
import { useT } from "next-i18next/client";
import { useState } from "react";
import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import {
  chatModelIds,
  chatModelRegistry,
  type ChatModelId,
} from "@/lib/langchain/models/registry";
import { cn } from "@/lib/utils";

type AgentModelFieldProps<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;
  id: string;
  disabled?: boolean;
};

export function AgentModelField<T extends FieldValues>({
  control,
  name,
  id,
  disabled,
}: AgentModelFieldProps<T>) {
  const { t } = useT("dashboard");
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const selectedModel = field.value as ChatModelId | undefined;
        const selectedDefinition = selectedModel
          ? chatModelRegistry[selectedModel]
          : undefined;

        function handleSelectModel(modelId: ChatModelId) {
          field.onChange(modelId);
          setDialogOpen(false);
        }

        return (
          <Field data-invalid={fieldState.invalid || undefined}>
            <FieldLabel htmlFor={id}>{t("agentDetail.general.model")}</FieldLabel>
            <div className="flex items-start justify-between gap-4 rounded-lg border border-border p-3">
              <div className="min-w-0 flex-1" id={id}>
                {selectedDefinition ? (
                  <>
                    <p className="text-sm font-medium">{selectedDefinition.label}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedDefinition.description}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {t("agentDetail.general.modelPlaceholder")}
                  </p>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={disabled}
                onClick={() => setDialogOpen(true)}
              >
                {t("agentDetail.general.changeModel")}
              </Button>
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogContent className="max-h-[80vh] sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>{t("agentDetail.general.modelDialogTitle")}</DialogTitle>
                  <DialogDescription>
                    {t("agentDetail.general.modelDialogDescription")}
                  </DialogDescription>
                </DialogHeader>

                <div className="max-h-[48vh] overflow-y-auto">
                  <ul className="flex flex-col gap-2 py-1">
                    {chatModelIds.map((modelId) => {
                      const definition = chatModelRegistry[modelId];
                      const isSelected = selectedModel === modelId;

                      return (
                        <li key={modelId}>
                          <button
                            type="button"
                            aria-pressed={isSelected}
                            disabled={disabled}
                            onClick={() => handleSelectModel(modelId)}
                            className={cn(
                              "flex w-full items-start gap-3 rounded-lg border p-3 text-left",
                              isSelected
                                ? "border-primary bg-accent"
                                : "border-border hover:bg-muted/50",
                              disabled && "cursor-not-allowed opacity-50",
                            )}
                          >
                            <span
                              className={cn(
                                "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border",
                                isSelected
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-muted-foreground/50",
                              )}
                            >
                              {isSelected ? <CheckIcon className="size-3" /> : null}
                            </span>
                            <span className="min-w-0">
                              <span className="block text-sm font-medium">
                                {definition.label}
                              </span>
                              <span className="block text-sm text-muted-foreground">
                                {definition.description}
                              </span>
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </DialogContent>
            </Dialog>

            <FieldError errors={[fieldState.error]} />
          </Field>
        );
      }}
    />
  );
}
