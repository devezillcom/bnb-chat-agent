"use client";

import type { UseFormRegister } from "react-hook-form";

import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { CreateToolFormValues } from "@/lib/tools/schema";
import type { ToolConfigFieldDefinition } from "@/lib/tools/tool-registry";

type ToolConfigFieldsProps = {
  fields: ToolConfigFieldDefinition[];
  register: UseFormRegister<CreateToolFormValues>;
  disabled?: boolean;
  errors?: Record<string, { message?: string } | undefined> | undefined;
};

export function ToolConfigFields({
  fields,
  register,
  disabled = false,
  errors,
}: ToolConfigFieldsProps) {
  if (fields.length === 0) {
    return null;
  }

  return (
    <FieldGroup>
      <Field>
        <FieldLabel>Configuration</FieldLabel>
        <FieldDescription>
          Values required by this tool. They are resolved when an agent runs
          the tool.
        </FieldDescription>
      </Field>

      {fields.map((field) => {
        const fieldError = errors?.[field.key];

        return (
          <Field key={field.key} data-invalid={!!fieldError || undefined}>
            <FieldLabel htmlFor={`tool-config-${field.key}`}>
              {field.label}
              {field.required ? " *" : ""}
            </FieldLabel>
            {field.description ? (
              <FieldDescription>{field.description}</FieldDescription>
            ) : null}
            <Input
              id={`tool-config-${field.key}`}
              type={field.secret ? "password" : "text"}
              autoComplete="off"
              disabled={disabled}
              {...register(`config.${field.key}`)}
            />
            <FieldError errors={fieldError ? [fieldError] : undefined} />
          </Field>
        );
      })}
    </FieldGroup>
  );
}
