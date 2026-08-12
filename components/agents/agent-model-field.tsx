"use client";

import { Controller, type Control, type FieldPath, type FieldValues } from "react-hook-form";

import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  chatModelIds,
  chatModelRegistry,
  type ChatModelId,
} from "@/lib/langchain/models/registry";

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
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const selectedModel = field.value as ChatModelId | undefined;
        const selectedDefinition = selectedModel
          ? chatModelRegistry[selectedModel]
          : undefined;

        return (
          <Field data-invalid={fieldState.invalid || undefined}>
            <FieldLabel htmlFor={id}>Model</FieldLabel>
            <Select
              value={selectedModel}
              onValueChange={(value) => {
                if (value) {
                  field.onChange(value);
                }
              }}
              disabled={disabled}
            >
              <SelectTrigger
                id={id}
                className="w-full"
                aria-invalid={fieldState.invalid || undefined}
              >
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent align="start">
                <SelectGroup>
                  {chatModelIds.map((modelId) => {
                    const definition = chatModelRegistry[modelId];
                    return (
                      <SelectItem key={modelId} value={modelId}>
                        {definition.label}
                      </SelectItem>
                    );
                  })}
                </SelectGroup>
              </SelectContent>
            </Select>
            {selectedDefinition ? (
              <FieldDescription>{selectedDefinition.description}</FieldDescription>
            ) : null}
            <FieldError errors={[fieldState.error]} />
          </Field>
        );
      }}
    />
  );
}
