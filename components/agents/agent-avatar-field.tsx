"use client";

import { Loader2Icon } from "lucide-react";
import { useRef, useState } from "react";
import { useT } from "next-i18next/client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/field";
import { toast } from "@/components/ui/toast";
import {
  AGENT_AVATAR_ACCEPT,
  AGENT_AVATAR_UPLOAD_RULES,
} from "@/lib/agents/constants";
import { getAgentListLeading } from "@/lib/agents/utils/get-agent-list-leading";
import { resolveAgentAvatarUrl } from "@/lib/agents/utils/get-agent-avatar-url";
import { workspaceFetch } from "@/lib/workspaces/utils/workspace-fetch";

type AgentAvatarFieldProps = {
  workspaceId: string;
  agentId: string;
  name: string;
  value: string | null;
  onChange: (value: string | null) => void;
  disabled?: boolean;
  onUploadingChange?: (uploading: boolean) => void;
};

export function AgentAvatarField({
  workspaceId,
  agentId,
  name,
  value,
  onChange,
  disabled = false,
  onUploadingChange,
}: AgentAvatarFieldProps) {
  const { t } = useT("dashboard");
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const previewUrl = resolveAgentAvatarUrl({ name, avatarUrl: value });
  const leading = getAgentListLeading(name);
  const isDisabled = disabled || uploading;

  function setUploadingState(next: boolean) {
    setUploading(next);
    onUploadingChange?.(next);
  }

  async function uploadAvatar(file: File) {
    if (!AGENT_AVATAR_UPLOAD_RULES.allowedMimes.has(file.type)) {
      toast.add({
        title: AGENT_AVATAR_UPLOAD_RULES.mimeError,
        type: "error",
      });
      return;
    }

    if (file.size > AGENT_AVATAR_UPLOAD_RULES.maxBytes) {
      toast.add({
        title: AGENT_AVATAR_UPLOAD_RULES.sizeError,
        type: "error",
      });
      return;
    }

    setUploadingState(true);

    try {
      const uploadUrlRes = await workspaceFetch(
        workspaceId,
        `/api/agents/${agentId}/avatar/upload-url`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contentType: file.type,
            contentLength: file.size,
          }),
        },
      );
      const uploadUrlData = (await uploadUrlRes.json()) as {
        uploadUrl?: string;
        publicUrl?: string;
        error?: string;
        message?: string;
      };

      if (
        !uploadUrlRes.ok ||
        !uploadUrlData.uploadUrl ||
        !uploadUrlData.publicUrl
      ) {
        throw new Error(
          uploadUrlData.message ??
            uploadUrlData.error ??
            "Could not prepare avatar upload.",
        );
      }

      const putRes = await fetch(uploadUrlData.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!putRes.ok) {
        throw new Error("Avatar upload failed.");
      }

      onChange(uploadUrlData.publicUrl);
    } catch (error) {
      toast.add({
        title:
          error instanceof Error ? error.message : "Avatar upload failed.",
        type: "error",
      });
    } finally {
      setUploadingState(false);

      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  return (
    <Field>
      <FieldLabel>{t("agentDetail.general.avatar")}</FieldLabel>
      <div className="flex items-center gap-4">
        <Avatar className="size-16">
          <AvatarImage src={previewUrl} alt="" />
          <AvatarFallback className={leading.className}>
            {leading.initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-wrap gap-2">
          <input
            ref={inputRef}
            type="file"
            accept={AGENT_AVATAR_ACCEPT}
            className="sr-only"
            disabled={isDisabled}
            onChange={(event) => {
              const file = event.target.files?.[0];

              if (file) {
                void uploadAvatar(file);
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            disabled={isDisabled}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? (
              <>
                <Loader2Icon className="animate-spin" data-icon="inline-start" />
                {t("agentDetail.general.avatarUploading")}
              </>
            ) : (
              t("agentDetail.general.avatarUpload")
            )}
          </Button>
          {value ? (
            <Button
              type="button"
              variant="ghost"
              disabled={isDisabled}
              onClick={() => onChange(null)}
            >
              {t("agentDetail.general.avatarRemove")}
            </Button>
          ) : null}
        </div>
      </div>
      <FieldDescription>
        {t("agentDetail.general.avatarDescription")}{" "}
        {t("agentDetail.general.avatarHint")}
      </FieldDescription>
    </Field>
  );
}
