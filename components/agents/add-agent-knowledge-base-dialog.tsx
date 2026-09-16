"use client";

import { Loader2Icon } from "lucide-react";
import { useT } from "next-i18next/client";
import { useEffect, useState, type ChangeEvent } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  knowledgeBaseFormSchema,
  type KnowledgeBaseFormValues,
} from "@/lib/knowledge-base/schema";

type AddAgentKnowledgeBaseDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  creating: boolean;
  onCreate: (values: KnowledgeBaseFormValues) => void | Promise<void>;
};

export function AddAgentKnowledgeBaseDialog({
  open,
  onOpenChange,
  creating,
  onCreate,
}: AddAgentKnowledgeBaseDialogProps) {
  const { t } = useT("dashboard");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open && !creating) {
      setName("");
      setDescription("");
      setFormError(null);
    }
  }, [open, creating]);

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen || !creating) {
      onOpenChange(nextOpen);
    }
  }

  async function handleSubmit() {
    const parsed = knowledgeBaseFormSchema.safeParse({ name, description });
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? "Invalid input.");
      return;
    }

    setFormError(null);
    await onCreate(parsed.data);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent showCloseButton={!creating} className="sm:max-w-md">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void handleSubmit();
          }}
        >
          <DialogHeader>
            <DialogTitle>{t("agentDetail.knowledge.addDialogTitle")}</DialogTitle>
            <DialogDescription>
              {t("agentDetail.knowledge.addDialogDescription")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="agent-kb-name">{t("agentDetail.knowledge.name")}</Label>
              <Input
                id="agent-kb-name"
                placeholder={t("agentDetail.knowledge.namePlaceholder")}
                value={name}
                onChange={(event) => setName(event.target.value)}
                disabled={creating}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="agent-kb-description">
                {t("agentDetail.knowledge.description")}
              </Label>
              <textarea
                id="agent-kb-description"
                placeholder={t("agentDetail.knowledge.descriptionPlaceholder")}
                rows={3}
                value={description}
                onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                  setDescription(event.target.value)
                }
                disabled={creating}
                className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-20 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            {formError ? (
              <p className="text-sm text-destructive">{formError}</p>
            ) : null}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={creating}
            >
              {t("agentDetail.cancel")}
            </Button>
            <Button type="submit" disabled={creating || !name.trim()}>
              {creating ? (
                <>
                  <Loader2Icon className="animate-spin" data-icon="inline-start" />
                  {t("agentDetail.knowledge.creating")}
                </>
              ) : (
                t("agentDetail.knowledge.createAndAdd")
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
