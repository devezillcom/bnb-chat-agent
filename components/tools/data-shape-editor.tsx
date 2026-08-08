"use client";

import { PlusIcon, Trash2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  createEmptyDataShapeField,
  DATA_SHAPE_FIELD_TYPES,
  type DataShape,
  type DataShapeFieldType,
} from "@/lib/tools/utils/data-shape";
import { cn } from "@/lib/utils";

type DataShapeEditorProps = {
  value: DataShape;
  onChange: (value: DataShape) => void;
  disabled?: boolean;
  label: string;
  description?: string;
  optional?: boolean;
  errorMessage?: string;
};

const FIELD_TYPE_LABELS: Record<DataShapeFieldType, string> = {
  string: "String",
  number: "Number",
  integer: "Integer",
  boolean: "Boolean",
};

export function DataShapeEditor({
  value,
  onChange,
  disabled = false,
  label,
  description,
  optional = false,
  errorMessage,
}: DataShapeEditorProps) {
  function updateField(index: number, patch: Partial<DataShape["fields"][number]>) {
    onChange({
      fields: value.fields.map((field, fieldIndex) =>
        fieldIndex === index ? { ...field, ...patch } : field,
      ),
    });
  }

  function addField() {
    onChange({
      fields: [...value.fields, createEmptyDataShapeField()],
    });
  }

  function removeField(index: number) {
    onChange({
      fields: value.fields.filter((_, fieldIndex) => fieldIndex !== index),
    });
  }

  return (
    <FieldGroup>
      <Field data-invalid={!!errorMessage || undefined}>
        <FieldLabel>{label}</FieldLabel>
        {description ? <FieldDescription>{description}</FieldDescription> : null}

        <div className="space-y-3">
          {value.fields.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border/70 px-3 py-4 text-sm text-muted-foreground">
              {optional
                ? "No output fields defined. Add fields if the tool returns structured data."
                : "Add at least one field to define what the agent can pass to this tool."}
            </p>
          ) : (
            value.fields.map((field, index) => (
              <div
                key={index}
                className="space-y-3 rounded-lg border border-border/60 bg-muted/10 p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    Field {index + 1}
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    disabled={disabled}
                    onClick={() => removeField(index)}
                    aria-label={`Remove field ${index + 1}`}
                  >
                    <Trash2Icon className="size-4" />
                  </Button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor={`shape-field-name-${index}`}>Name</FieldLabel>
                    <Input
                      id={`shape-field-name-${index}`}
                      value={field.name}
                      autoComplete="off"
                      placeholder="query"
                      disabled={disabled}
                      onChange={(event) =>
                        updateField(index, { name: event.target.value })
                      }
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor={`shape-field-type-${index}`}>Type</FieldLabel>
                    <select
                      id={`shape-field-type-${index}`}
                      value={field.type}
                      disabled={disabled}
                      className={cn(
                        "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50",
                      )}
                      onChange={(event) =>
                        updateField(index, {
                          type: event.target.value as DataShapeFieldType,
                        })
                      }
                    >
                      {DATA_SHAPE_FIELD_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {FIELD_TYPE_LABELS[type]}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>

                <Field>
                  <FieldLabel htmlFor={`shape-field-description-${index}`}>
                    Description
                  </FieldLabel>
                  <Input
                    id={`shape-field-description-${index}`}
                    value={field.description ?? ""}
                    autoComplete="off"
                    placeholder="What this field represents"
                    disabled={disabled}
                    onChange={(event) =>
                      updateField(index, { description: event.target.value })
                    }
                  />
                </Field>

                <div className="flex items-center justify-between rounded-md border border-border/50 px-3 py-2">
                  <div>
                    <p className="text-sm font-medium">Required</p>
                    <p className="text-xs text-muted-foreground">
                      Agent must provide this field when calling the tool.
                    </p>
                  </div>
                  <Switch
                    checked={field.required}
                    disabled={disabled}
                    onCheckedChange={(checked) =>
                      updateField(index, { required: checked })
                    }
                  />
                </div>
              </div>
            ))
          )}
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          className="mt-3"
          onClick={addField}
        >
          <PlusIcon data-icon="inline-start" />
          Add field
        </Button>

        <FieldError errors={errorMessage ? [{ message: errorMessage }] : undefined} />
      </Field>
    </FieldGroup>
  );
}
