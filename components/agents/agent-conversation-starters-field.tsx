"use client";

import { PlusIcon, XIcon } from "lucide-react";
import { useT } from "next-i18next/client";
import {
  Controller,
  useFieldArray,
  useFormState,
  type Control,
} from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { AGENT_CONVERSATION_STARTER_MAX_COUNT } from "@/lib/agents/constants";
import type { AgentGreetingFormValues } from "@/lib/agents/schema";

type AgentConversationStartersFieldProps = {
  control: Control<AgentGreetingFormValues>;
  disabled?: boolean;
};

export function AgentConversationStartersField({
  control,
  disabled = false,
}: AgentConversationStartersFieldProps) {
  const { t } = useT("dashboard");
  const { fields, append, remove } = useFieldArray({
    control,
    name: "conversationStarters",
  });
  const { errors } = useFormState({ control });
  const listError = errors.conversationStarters;
  const listMessage =
    (typeof listError?.message === "string" && listError.message) ||
    listError?.root?.message;
  const atLimit = fields.length >= AGENT_CONVERSATION_STARTER_MAX_COUNT;

  return (
    <Field data-invalid={!!listMessage || undefined}>
      <FieldLabel>{t("agentDetail.general.conversationStarters")}</FieldLabel>
      <FieldDescription>
        {t("agentDetail.general.conversationStartersDescription")}
      </FieldDescription>
      {fields.length > 0 ? (
        <div className="space-y-2">
          {fields.map((field, index) => {
            const itemError = listError?.[index]?.text;

            return (
              <div key={field.id} className="flex items-start gap-2">
                <Field
                  className="min-w-0 flex-1"
                  data-invalid={!!itemError || undefined}
                >
                  <Controller
                    control={control}
                    name={`conversationStarters.${index}.text`}
                    render={({ field }) => (
                      <Input
                        aria-label={t(
                          "agentDetail.general.conversationStarters",
                        )}
                        placeholder={t(
                          "agentDetail.general.conversationStartersPlaceholder",
                        )}
                        aria-invalid={!!itemError}
                        disabled={disabled}
                        {...field}
                      />
                    )}
                  />
                  <FieldError errors={[itemError]} />
                </Field>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={t(
                    "agentDetail.general.conversationStartersRemove",
                  )}
                  disabled={disabled}
                  onClick={() => remove(index)}
                >
                  <XIcon />
                </Button>
              </div>
            );
          })}
        </div>
      ) : null}
      <div>
        <Button
          type="button"
          variant="outline"
          disabled={disabled || atLimit}
          onClick={() => append({ text: "" })}
        >
          <PlusIcon data-icon="inline-start" />
          {t("agentDetail.general.conversationStartersAdd")}
        </Button>
      </div>
      <FieldError errors={listMessage ? [{ message: listMessage }] : []} />
    </Field>
  );
}
