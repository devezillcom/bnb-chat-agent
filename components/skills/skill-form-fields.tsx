"use client";

import type { FieldErrors, UseFormRegister, UseFormSetValue, UseFormWatch } from "react-hook-form";

import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { SkillFormValues } from "@/lib/skills/schema";
import type { ToolListItem } from "@/lib/tools/types";
import { cn } from "@/lib/utils";

type SkillFormFieldsProps = {
  register: UseFormRegister<SkillFormValues>;
  watch: UseFormWatch<SkillFormValues>;
  setValue: UseFormSetValue<SkillFormValues>;
  errors: FieldErrors<SkillFormValues>;
  disabled?: boolean;
  workspaceTools: ToolListItem[];
  usedSlugs: Set<string>;
  showSlugWarning?: boolean;
  idPrefix: string;
};

export function SkillFormFields({
  register,
  watch,
  setValue,
  errors,
  disabled = false,
  workspaceTools,
  usedSlugs,
  showSlugWarning = false,
  idPrefix,
}: SkillFormFieldsProps) {
  const nameError = errors.name;
  const slugError = errors.slug;
  const descriptionError = errors.description;
  const instructionsError = errors.instructions;
  const toolsError = errors.tools;
  const slugValue = watch("slug");
  const selectedTools = watch("tools") ?? [];
  const slugTaken =
    slugValue.trim().length > 0 && usedSlugs.has(slugValue.trim());

  function toggleToolSlug(slug: string, checked: boolean) {
    const nextTools = checked
      ? [...selectedTools, slug]
      : selectedTools.filter((value) => value !== slug);

    setValue("tools", nextTools, { shouldDirty: true, shouldValidate: true });
  }

  return (
    <FieldGroup>
      <Field data-invalid={!!slugError || slugTaken || undefined}>
        <FieldLabel htmlFor={`${idPrefix}-slug`}>Slug</FieldLabel>
        <FieldDescription>
          Unique identifier referenced in agent prompts (e.g.{" "}
          <code className="text-xs">guest_support</code>).
        </FieldDescription>
        {showSlugWarning ? (
          <div className="rounded-lg border border-amber-200/80 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100">
            Changing the slug may break agent prompts that reference the old
            slug.
          </div>
        ) : null}
        <Input
          id={`${idPrefix}-slug`}
          autoComplete="off"
          placeholder="guest_support"
          aria-invalid={!!slugError || slugTaken}
          disabled={disabled}
          {...register("slug")}
        />
        {slugTaken ? (
          <FieldError
            errors={[
              {
                message: "This slug is already used in the workspace.",
              },
            ]}
          />
        ) : (
          <FieldError errors={[slugError]} />
        )}
      </Field>

      <Field data-invalid={!!nameError || undefined}>
        <FieldLabel htmlFor={`${idPrefix}-name`}>Name</FieldLabel>
        <FieldDescription>
          Display name shown in lists and agent skill pickers.
        </FieldDescription>
        <Input
          id={`${idPrefix}-name`}
          autoComplete="off"
          placeholder="Guest support"
          aria-invalid={!!nameError}
          disabled={disabled}
          {...register("name")}
        />
        <FieldError errors={[nameError]} />
      </Field>

      <Field data-invalid={!!descriptionError || undefined}>
        <FieldLabel htmlFor={`${idPrefix}-description`}>Description</FieldLabel>
        <FieldDescription>
          Optional summary for lists and skill selection screens.
        </FieldDescription>
        <Input
          id={`${idPrefix}-description`}
          autoComplete="off"
          placeholder="Handles guest inquiries and booking questions."
          aria-invalid={!!descriptionError}
          disabled={disabled}
          {...register("description")}
        />
        <FieldError errors={[descriptionError]} />
      </Field>

      <Field data-invalid={!!instructionsError || undefined}>
        <FieldLabel htmlFor={`${idPrefix}-instructions`}>Instructions</FieldLabel>
        <FieldDescription>
          Guidance injected into the agent system prompt when this skill is
          attached.
        </FieldDescription>
        <textarea
          id={`${idPrefix}-instructions`}
          rows={8}
          placeholder="When handling guest support, prioritize booking details, house rules, and check-in instructions..."
          aria-invalid={!!instructionsError}
          disabled={disabled}
          className="flex min-h-40 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
          {...register("instructions")}
        />
        <FieldError errors={[instructionsError]} />
      </Field>

      <Field data-invalid={!!toolsError || undefined}>
        <FieldLabel>Tools</FieldLabel>
        <FieldDescription>
          Optional workspace tools this skill may use at runtime.
        </FieldDescription>
        {workspaceTools.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No workspace tools yet. Add tools first if this skill should call
            them.
          </p>
        ) : (
          <div className="space-y-2 rounded-lg border border-border/60 p-3">
            {workspaceTools.map((tool) => {
              const checked = selectedTools.includes(tool.slug);

              return (
                <label
                  key={tool.id}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-md px-2 py-2 transition-colors hover:bg-muted/40",
                    disabled && "cursor-not-allowed opacity-60",
                  )}
                >
                  <input
                    type="checkbox"
                    className="mt-1 size-4 shrink-0 rounded border border-input"
                    checked={checked}
                    disabled={disabled}
                    onChange={(event) =>
                      toggleToolSlug(tool.slug, event.target.checked)
                    }
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">{tool.name}</span>
                    <span className="block text-xs text-muted-foreground">
                      <code>{tool.slug}</code>
                      {tool.description ? ` — ${tool.description}` : null}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        )}
        <FieldError errors={[toolsError]} />
      </Field>
    </FieldGroup>
  );
}
