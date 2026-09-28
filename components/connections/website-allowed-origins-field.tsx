"use client";

import { PlusIcon, XIcon } from "lucide-react";
import { useRef } from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import { useT } from "next-i18next/client";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { WEBSITE_ALLOWED_ORIGINS_MAX } from "@/lib/connections/constants";
import type { WebsiteConnectionFormValues } from "@/lib/connections/schema";
import type { WebsiteConnectionMetadata } from "@/lib/connections/types";

type OriginFieldErrors = {
  message?: string;
  root?: { message?: string };
  [index: number]: { message?: string } | undefined;
};

export function toWebsiteOriginsFormValue(
  metadata: WebsiteConnectionMetadata | null,
): Pick<WebsiteConnectionFormValues, "allowAllOrigins" | "allowedOrigins"> {
  if (!metadata || metadata.allow_all_origins) {
    return {
      allowAllOrigins: metadata?.allow_all_origins ?? false,
      allowedOrigins: [""],
    };
  }

  return {
    allowAllOrigins: false,
    allowedOrigins:
      metadata.allowed_origins.length > 0 ? metadata.allowed_origins : [""],
  };
}

export function WebsiteAllowedOriginsField({
  disabled,
  idPrefix,
}: {
  disabled?: boolean;
  idPrefix: string;
}) {
  const { t } = useT("dashboard");
  const {
    control,
    register,
    setValue,
    getValues,
    clearErrors,
    formState: { errors },
  } = useFormContext<WebsiteConnectionFormValues>();
  const allowAllOrigins = useWatch({ control, name: "allowAllOrigins" });
  const allowedOrigins = useWatch({ control, name: "allowedOrigins" }) ?? [""];
  const rowIdsRef = useRef<string[]>([]);

  if (rowIdsRef.current.length !== allowedOrigins.length) {
    rowIdsRef.current = allowedOrigins.map(
      (_, index) => rowIdsRef.current[index] ?? crypto.randomUUID(),
    );
  }
  const originErrors = errors.allowedOrigins as OriginFieldErrors | undefined;
  const listMessage = originErrors?.message ?? originErrors?.root?.message;
  const hasItemError = allowedOrigins.some(
    (_, index) => Boolean(originErrors?.[index]?.message),
  );

  function addOrigin() {
    const current = getValues("allowedOrigins");
    if (current.length >= WEBSITE_ALLOWED_ORIGINS_MAX) {
      return;
    }

    const nextId = crypto.randomUUID();
    rowIdsRef.current = [...rowIdsRef.current, nextId];
    setValue("allowedOrigins", [...current, ""], {
      shouldDirty: true,
    });
  }

  function removeOrigin(index: number) {
    const current = getValues("allowedOrigins");
    const next = current.filter((_, itemIndex) => itemIndex !== index);
    rowIdsRef.current = rowIdsRef.current.filter(
      (_, itemIndex) => itemIndex !== index,
    );
    setValue("allowedOrigins", next.length > 0 ? next : [""], {
      shouldDirty: true,
      shouldValidate: true,
    });
  }

  return (
    <Field data-invalid={Boolean(listMessage || hasItemError) || undefined}>
      <FieldLabel>{t("websiteConnection.originsLabel")}</FieldLabel>
      <FieldDescription>
        {t("websiteConnection.originsDescription")}
      </FieldDescription>

      <div className="flex items-center justify-between gap-4 rounded-lg border px-3 py-2">
        <div className="min-w-0 space-y-0.5">
          <FieldLabel htmlFor={`${idPrefix}-allow-all`} className="text-sm">
            {t("websiteConnection.allowAllLabel")}
          </FieldLabel>
          <p className="text-xs text-muted-foreground">
            {t("websiteConnection.allowAllDescription")}
          </p>
        </div>
        <Controller
          control={control}
          name="allowAllOrigins"
          render={({ field }) => (
            <Switch
              id={`${idPrefix}-allow-all`}
              checked={field.value}
              disabled={disabled}
              onCheckedChange={(checked) => {
                field.onChange(checked);
                if (checked) {
                  clearErrors("allowedOrigins");
                }
              }}
              onBlur={field.onBlur}
            />
          )}
        />
      </div>

      {allowAllOrigins ? null : (
        <div className="space-y-2">
          {allowedOrigins.map((_, index) => {
            const itemMessage = originErrors?.[index]?.message;

            return (
              <div key={rowIdsRef.current[index]} className="space-y-1">
                <div className="flex items-center gap-2">
                  <Input
                    id={`${idPrefix}-origin-${index}`}
                    autoComplete="off"
                    inputMode="url"
                    placeholder={t("websiteConnection.originsPlaceholder")}
                    aria-label={t("websiteConnection.originInputLabel", {
                      index: index + 1,
                    })}
                    aria-invalid={Boolean(itemMessage) || undefined}
                    disabled={disabled}
                    {...register(`allowedOrigins.${index}`)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={t("websiteConnection.removeOrigin")}
                    disabled={disabled || allowedOrigins.length <= 1}
                    onClick={() => removeOrigin(index)}
                  >
                    <XIcon />
                  </Button>
                </div>
                <FieldError errors={itemMessage ? [{ message: itemMessage }] : []} />
              </div>
            );
          })}

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled || allowedOrigins.length >= WEBSITE_ALLOWED_ORIGINS_MAX}
            onClick={addOrigin}
          >
            <PlusIcon data-icon="inline-start" />
            {t("websiteConnection.addOrigin")}
          </Button>
        </div>
      )}

      <FieldError errors={listMessage ? [{ message: listMessage }] : []} />
    </Field>
  );
}
