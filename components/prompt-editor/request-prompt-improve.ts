"use client";

import { toast } from "@/components/ui/toast";
import { workspaceFetch } from "@/lib/workspaces/utils/workspace-fetch";

type PromptImproveResponse = {
  message?: string;
  error?: string;
  [key: string]: unknown;
};

export async function requestPromptImprove(params: {
  workspaceId: string;
  path: string;
  body: Record<string, unknown>;
  readText: (data: PromptImproveResponse) => string | undefined;
}): Promise<string | null> {
  try {
    const res = await workspaceFetch(params.workspaceId, params.path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params.body),
    });
    const data = (await res.json()) as PromptImproveResponse;
    const text = params.readText(data);

    if (res.ok && text) {
      toast.add({
        title: data.message ?? "Instructions improved.",
        type: "success",
      });
      return text;
    }

    toast.add({
      title: data.error ?? data.message ?? "Something went wrong.",
      type: "error",
    });
    return null;
  } catch {
    toast.add({ title: "Something went wrong.", type: "error" });
    return null;
  }
}
