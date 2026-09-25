"use client";

import {
  Controller,
  type Control,
  type FieldErrors,
  type UseFormRegister,
} from "react-hook-form";
import { useT } from "next-i18next/client";

import {
  PromptEditorWithImprove,
  type PromptImproveRequest,
} from "@/components/prompt-editor";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import type { AgentMentionItem } from "@/lib/agents/types";
import type { SkillFormValues } from "@/lib/skills/schema";

type SkillFormFieldsProps = {
  register: UseFormRegister<SkillFormValues>;
  control: Control<SkillFormValues>;
  errors: FieldErrors<SkillFormValues>;
  mentionItems: AgentMentionItem[] | undefined;
  disabled?: boolean;
  idPrefix: string;
  onImproveInstructions: (
    request?: PromptImproveRequest,
  ) => Promise<string | null>;
};

export function SkillFormFields({
  register,
  control,
  errors,
  mentionItems,
  disabled = false,
  idPrefix,
  onImproveInstructions,
}: SkillFormFieldsProps) {
  const { t } = useT("dashboard");
  const nameError = errors.name;
  const descriptionError = errors.description;
  const instructionsError = errors.instructions;

  return (
    <FieldGroup>
      <Field data-invalid={!!nameError || undefined}>
        <FieldLabel htmlFor={`${idPrefix}-name`}>
          {t("skillForm.name.label")}
        </FieldLabel>
        <FieldDescription>{t("skillForm.name.description")}</FieldDescription>
        <Input
          id={`${idPrefix}-name`}
          autoComplete="off"
          placeholder={t("skillForm.name.placeholder")}
          aria-invalid={!!nameError}
          disabled={disabled}
          {...register("name")}
        />
        <FieldError errors={[nameError]} />
      </Field>

      <Field data-invalid={!!descriptionError || undefined}>
        <FieldLabel htmlFor={`${idPrefix}-description`}>
          {t("skillForm.useCases.label")}
        </FieldLabel>
        <FieldDescription>{t("skillForm.useCases.description")}</FieldDescription>
        <Input
          id={`${idPrefix}-description`}
          autoComplete="off"
          placeholder={t("skillForm.useCases.placeholder")}
          aria-invalid={!!descriptionError}
          disabled={disabled}
          {...register("description")}
        />
        <FieldError errors={[descriptionError]} />
      </Field>

      <Field data-invalid={!!instructionsError || undefined}>
        <FieldLabel htmlFor={`${idPrefix}-instructions`}>
          {t("skillForm.instructions.label")}
        </FieldLabel>
        <FieldDescription>
          {t("skillForm.instructions.description")}
        </FieldDescription>
        {mentionItems === undefined ? (
          <Skeleton className="h-40 w-full rounded-lg" />
        ) : (
          <Controller
            control={control}
            name="instructions"
            render={({ field }) => (
              <PromptEditorWithImprove
                id={`${idPrefix}-instructions`}
                ariaLabel={t("skillForm.instructions.label")}
                ariaInvalid={!!instructionsError}
                disabled={disabled}
                placeholder={t("skillForm.instructions.placeholder")}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                items={mentionItems}
                mentionTagsLabel={t(
                  "agentDetail.instructions.mentionTagsLabel",
                )}
                mentionHint={t("agentDetail.instructions.mentionHint")}
                minHeightClassName="min-h-40"
                improveLabel={t("agentDetail.instructions.improveWithAi")}
                improvingLabel={t("agentDetail.instructions.improving")}
                onImprove={onImproveInstructions}
              />
            )}
          />
        )}
        <FieldError errors={[instructionsError]} />
      </Field>
    </FieldGroup>
  );
}
