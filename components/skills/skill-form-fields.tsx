"use client";

import type { FieldErrors, UseFormRegister, UseFormWatch } from "react-hook-form";
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
  watch: UseFormWatch<SkillFormValues>;
  errors: FieldErrors<SkillFormValues>;
  disabled?: boolean;
  usedSlugs: Set<string>;
  showSlugWarning?: boolean;
  idPrefix: string;
};

export function SkillFormFields({
  register,
  watch,
  errors,
  disabled = false,
  usedSlugs,
  showSlugWarning = false,
  idPrefix,
}: SkillFormFieldsProps) {
  const { t } = useT("dashboard");
  const nameError = errors.name;
  const slugError = errors.slug;
  const descriptionError = errors.description;
  const instructionsError = errors.instructions;
  const slugValue = watch("slug");
  const slugTaken =
    slugValue.trim().length > 0 && usedSlugs.has(slugValue.trim());

  return (
    <FieldGroup>
      <Field data-invalid={!!slugError || slugTaken || undefined}>
        <FieldLabel htmlFor={`${idPrefix}-slug`}>
          {t("skillForm.slug.label")}
        </FieldLabel>
        <FieldDescription>{t("skillForm.slug.description")}</FieldDescription>
        {showSlugWarning ? (
          <div className="rounded-lg border border-amber-200/80 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100">
            {t("skillForm.slug.changeWarning")}
          </div>
        ) : null}
        <Input
          id={`${idPrefix}-slug`}
          autoComplete="off"
          placeholder={t("skillForm.slug.placeholder")}
          aria-invalid={!!slugError || slugTaken}
          disabled={disabled}
          {...register("slug")}
        />
        {slugTaken ? (
          <FieldError
            errors={[
              {
                message: t("skillForm.slug.taken"),
              },
            ]}
          />
        ) : (
          <FieldError errors={[slugError]} />
        )}
      </Field>

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
