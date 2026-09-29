import { workspaceFetch } from "@/lib/workspaces/utils/workspace-fetch";

export async function patchAgent(params: {
  workspaceId: string;
  agentId: string;
  body: Record<string, unknown>;
}): Promise<{ ok: boolean; message: string }> {
  const res = await workspaceFetch(
    params.workspaceId,
    `/api/agents/${params.agentId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params.body),
    },
  );
  const data = (await res.json()) as { message?: string; error?: string };

  if (res.ok) {
    return { ok: true, message: data.message ?? "Assistant updated." };
  }

  return {
    ok: false,
    message: data.message ?? data.error ?? "Something went wrong.",
  };
}
