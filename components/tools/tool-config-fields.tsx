"use client";

import type { Control } from "react-hook-form";
import { Controller, useWatch } from "react-hook-form";

import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
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

function configValueToString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function resolveConfigValue(
  config: Record<string, unknown> | undefined,
  key: string,
  fields: ToolConfigFieldDefinition[],
): string {
  const value = configValueToString(config?.[key]);
  if (value) {
    return value;
  }

  return fields.find((field) => field.key === key)?.defaultValue ?? "";
}

function isFieldVisible(
  field: ToolConfigFieldDefinition,
  config: Record<string, unknown> | undefined,
  fields: ToolConfigFieldDefinition[],
): boolean {
  if (!field.showWhen) {
    return true;
  }

  const conditions = Array.isArray(field.showWhen)
    ? field.showWhen
    : [field.showWhen];

  return conditions.every((condition) =>
    condition.values.includes(resolveConfigValue(config, condition.key, fields)),
  );
}

export function ToolConfigFields({
  fields,
  control,
  disabled = false,
  errors,
}: ToolConfigFieldsProps) {
  const configValues = useWatch({ control, name: "config" });

  if (fields.length === 0) {
    return null;
  }

  const visibleFields = fields.filter((field) =>
    isFieldVisible(field, configValues, fields),
  );

  if (visibleFields.length === 0) {
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

      {visibleFields.map((field) => {
        const fieldError = errors?.[field.key];
        const fieldDomId = `tool-config-${toFieldDomId(field.key)}`;
        const fieldType = field.type ?? "text";

        return (
          <Controller
            key={field.key}
            control={control}
            name="config"
            render={({ field: configField }) => {
              const value = configValueToString(configField.value?.[field.key]);

              function updateConfig(nextValue: string) {
                configField.onChange({
                  ...configField.value,
                  [field.key]: nextValue,
                });
              }

              if (fieldType === "radio" && field.options?.length) {
                return (
                  <Field data-invalid={!!fieldError || undefined}>
                    <FieldSet data-slot="radio-group">
                      <FieldLegend variant="label">
                        {field.label}
                        {field.required ? " *" : ""}
                      </FieldLegend>
                      {field.description ? (
                        <FieldDescription>{field.description}</FieldDescription>
                      ) : null}
                      <RadioGroup
                        value={value || field.defaultValue || ""}
                        onValueChange={(nextValue) => {
                          if (nextValue) {
                            updateConfig(nextValue);
                          }
                        }}
                        disabled={disabled}
                      >
                        {field.options.map((option) => {
                          const optionId = `${fieldDomId}-${toFieldDomId(option.value)}`;

                          return (
                            <Field key={option.value} orientation="horizontal">
                              <RadioGroupItem
                                value={option.value}
                                id={optionId}
                                aria-invalid={!!fieldError || undefined}
                              />
                              <FieldContent>
                                <FieldLabel htmlFor={optionId}>
                                  {option.label}
                                </FieldLabel>
                                {option.description ? (
                                  <FieldDescription>
                                    {option.description}
                                  </FieldDescription>
                                ) : null}
                              </FieldContent>
                            </Field>
                          );
                        })}
                      </RadioGroup>
                    </FieldSet>
                    <FieldError errors={fieldError ? [fieldError] : undefined} />
                  </Field>
                );
              }

              if (fieldType === "select" && field.options?.length) {
                return (
                  <Field data-invalid={!!fieldError || undefined}>
                    <FieldLabel htmlFor={fieldDomId}>
                      {field.label}
                      {field.required ? " *" : ""}
                    </FieldLabel>
                    {field.description ? (
                      <FieldDescription>{field.description}</FieldDescription>
                    ) : null}
                    <Select
                      value={value || field.defaultValue || ""}
                      onValueChange={(nextValue) => {
                        if (nextValue) {
                          updateConfig(nextValue);
                        }
                      }}
                      disabled={disabled}
                    >
                      <SelectTrigger
                        id={fieldDomId}
                        className="w-full"
                        aria-invalid={!!fieldError || undefined}
                      >
                        <SelectValue
                          placeholder={field.placeholder ?? "Select an option"}
                        />
                      </SelectTrigger>
                      <SelectContent align="start">
                        <SelectGroup>
                          {field.options.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <FieldError errors={fieldError ? [fieldError] : undefined} />
                  </Field>
                );
              }

              if (fieldType === "textarea") {
                return (
                  <Field data-invalid={!!fieldError || undefined}>
                    <FieldLabel htmlFor={fieldDomId}>
                      {field.label}
                      {field.required ? " *" : ""}
                    </FieldLabel>
                    {field.description ? (
                      <FieldDescription>{field.description}</FieldDescription>
                    ) : null}
                    <Textarea
                      id={fieldDomId}
                      autoComplete="off"
                      disabled={disabled}
                      placeholder={field.placeholder}
                      aria-invalid={!!fieldError || undefined}
                      value={value}
                      onChange={(event) => updateConfig(event.target.value)}
                      onBlur={configField.onBlur}
                    />
                    <FieldError errors={fieldError ? [fieldError] : undefined} />
                  </Field>
                );
              }

              return (
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
                    placeholder={field.placeholder}
                    aria-invalid={!!fieldError || undefined}
                    value={value}
                    onChange={(event) => updateConfig(event.target.value)}
                    onBlur={configField.onBlur}
                  />
                  <FieldError errors={fieldError ? [fieldError] : undefined} />
                </Field>
              );
            }}
          />
        );
      })}
    </FieldGroup>
  );
}
