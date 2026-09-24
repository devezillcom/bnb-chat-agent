"use client";

import type { FieldErrors, UseFormRegister } from "react-hook-form";
import { useT } from "next-i18next/client";

import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { SkillFormValues } from "@/lib/skills/schema";

type SkillFormFieldsProps = {
  register: UseFormRegister<SkillFormValues>;
  errors: FieldErrors<SkillFormValues>;
  disabled?: boolean;
  idPrefix: string;
};

export function SkillFormFields({
  register,
  errors,
  disabled = false,
  idPrefix,
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
        <textarea
          id={`${idPrefix}-instructions`}
          rows={8}
          placeholder={t("skillForm.instructions.placeholder")}
          aria-invalid={!!instructionsError}
          disabled={disabled}
          className="flex min-h-40 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
          {...register("instructions")}
        />
        <FieldError errors={[instructionsError]} />
      </Field>
    </FieldGroup>
  );
}
