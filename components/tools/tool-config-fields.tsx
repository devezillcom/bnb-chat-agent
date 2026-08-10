"use client";

import type { Control } from "react-hook-form";
import { Controller } from "react-hook-form";

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
  control: Control<CreateToolFormValues>;
  disabled?: boolean;
  errors?: Record<string, { message?: string } | undefined> | undefined;
};

function toFieldDomId(key: string): string {
  return key.replace(/[^a-zA-Z0-9_-]/g, "-");
}

export function ToolConfigFields({
  fields,
  control,
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
        const fieldDomId = `tool-config-${toFieldDomId(field.key)}`;

        return (
          <Controller
            key={field.key}
            control={control}
            name="config"
            render={({ field: configField }) => (
              <Field data-invalid={!!fieldError || undefined}>
                <FieldLabel htmlFor={fieldDomId}>
                  {field.label}
                  {field.required ? " *" : ""}
                </FieldLabel>
                {field.description ? (
                  <FieldDescription>{field.description}</FieldDescription>
                ) : null}
                <Input
                  id={fieldDomId}
                  type={field.secret ? "password" : "text"}
                  autoComplete="off"
                  disabled={disabled}
                  value={configField.value?.[field.key] ?? ""}
                  onChange={(event) => {
                    configField.onChange({
                      ...configField.value,
                      [field.key]: event.target.value,
                    });
                  }}
                  onBlur={configField.onBlur}
                />
                <FieldError errors={fieldError ? [fieldError] : undefined} />
              </Field>
            )}
          />
        );
      })}
    </FieldGroup>
  );
}
