"use server";

import { createServerAction } from "@/lib/exposers/create-server-action";
import { getDefaultUploadSignedUrl } from "./services/get-default-upload-signed-url";
import type { GetUploadSignedUrlResult } from "./types";

export const getDefaultUploadSignedUrlAction = createServerAction<
  (params: unknown) => Promise<GetUploadSignedUrlResult>
>(getDefaultUploadSignedUrl, { allowedRoles: ["user", "admin"] });
