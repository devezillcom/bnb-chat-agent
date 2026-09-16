import { workspaceFetch } from "@/lib/workspaces/utils/workspace-fetch";

export async function uploadKnowledgeBaseFile(
  workspaceId: string,
  knowledgeBaseId: string,
  file: File,
): Promise<void> {
  const uploadUrlRes = await workspaceFetch(
    workspaceId,
    `/api/knowledge-bases/${knowledgeBaseId}/documents/upload-url`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: file.name,
        contentType: file.type || "application/octet-stream",
        contentLength: file.size,
      }),
    },
  );
  const uploadUrlData = (await uploadUrlRes.json()) as {
    uploadUrl?: string;
    key?: string;
    error?: string;
    message?: string;
  };

  if (!uploadUrlRes.ok || !uploadUrlData.uploadUrl || !uploadUrlData.key) {
    throw new Error(
      uploadUrlData.message ??
        uploadUrlData.error ??
        `Could not prepare upload for ${file.name}.`,
    );
  }

  const putRes = await fetch(uploadUrlData.uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file.type || "application/octet-stream",
    },
    body: file,
  });

  if (!putRes.ok) {
    throw new Error(`Upload failed for ${file.name}.`);
  }

  const createRes = await workspaceFetch(
    workspaceId,
    `/api/knowledge-bases/${knowledgeBaseId}/documents`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        key: uploadUrlData.key,
        filename: file.name,
        contentType: file.type || "application/octet-stream",
        contentLength: file.size,
      }),
    },
  );
  const createData = (await createRes.json()) as {
    message?: string;
    error?: string;
  };

  if (!createRes.ok) {
    throw new Error(
      createData.message ??
        createData.error ??
        `Could not queue processing for ${file.name}.`,
    );
  }
}
