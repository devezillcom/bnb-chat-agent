const BIENHINH_BASE_URL = "https://bienhinh.vn";
const BIENHINH_IMAGES_API_URL = `${BIENHINH_BASE_URL}/api/v1/images`;

const PENDING_STATUSES = new Set(["QUEUE", "QUEUED", "PROCESSING"]);
const COMPLETED_STATUS = "COMPLETED";

export type BienhinhImageRequest = {
  id?: string;
  status?: string;
  queuePosition?: number;
};

export type BienhinhGeneratedImage = {
  templateName?: string;
  imageUrl?: string;
};

export type BienhinhImageApiResponse = {
  request?: BienhinhImageRequest;
  generatedImage?: BienhinhGeneratedImage;
  message?: string;
  error?: string;
  errorCode?: string;
  errorCategory?: string;
  validation?: {
    pass?: boolean;
    reason?: string;
  };
};

export type BienhinhImagePollStatus = "pending" | "completed" | "failed";

export type ParsedBienhinhImageResponse = {
  status: BienhinhImagePollStatus;
  requestId?: string;
  templateName?: string;
  imageUrl?: string;
  queuePosition?: number;
  message?: string;
  error?: string;
  errorCode?: string;
  rawStatus?: string;
};

export function getBienhinhApiToken(): string | null {
  return process.env.BIENHINH_API_TOKEN?.trim() || null;
}

export function toAbsoluteBienhinhImageUrl(imageUrl: string): string {
  if (/^https?:\/\//i.test(imageUrl)) {
    return imageUrl;
  }

  return new URL(imageUrl, `${BIENHINH_BASE_URL}/`).toString();
}

function normalizeRequestStatus(status: string | undefined): string {
  return status?.trim().toUpperCase() ?? "";
}

function extractBienhinhApiError(
  parsed: BienhinhImageApiResponse,
): { error: string; errorCode?: string } | null {
  const topLevelError = parsed.error?.trim();
  const validationReason = parsed.validation?.reason?.trim();
  const errorCode = parsed.errorCode?.trim();
  const validationFailed = parsed.validation?.pass === false;

  if (topLevelError || validationReason || errorCode || validationFailed) {
    return {
      error:
        topLevelError ||
        validationReason ||
        parsed.message?.trim() ||
        "Image generation failed.",
      errorCode: errorCode || undefined,
    };
  }

  return null;
}

export function parseBienhinhImageResponse(
  body: unknown,
): ParsedBienhinhImageResponse {
  const parsed =
    typeof body === "string"
      ? (JSON.parse(body) as BienhinhImageApiResponse)
      : (body as BienhinhImageApiResponse);

  const requestId = parsed.request?.id?.trim();
  const rawStatus = normalizeRequestStatus(parsed.request?.status);
  const templateName = parsed.generatedImage?.templateName?.trim();
  const imageUrl = parsed.generatedImage?.imageUrl?.trim();
  const apiError = extractBienhinhApiError(parsed);

  if (rawStatus === COMPLETED_STATUS && templateName && imageUrl) {
    return {
      status: "completed",
      requestId,
      templateName,
      imageUrl: toAbsoluteBienhinhImageUrl(imageUrl),
      message: parsed.message,
      rawStatus,
    };
  }

  if (PENDING_STATUSES.has(rawStatus)) {
    return {
      status: "pending",
      requestId,
      queuePosition: parsed.request?.queuePosition,
      message: parsed.message,
      rawStatus,
    };
  }

  if (apiError) {
    return {
      status: "failed",
      requestId,
      error: apiError.error,
      errorCode: apiError.errorCode,
      message: parsed.message,
      rawStatus: rawStatus || undefined,
    };
  }

  return {
    status: "failed",
    requestId,
    error:
      parsed.message?.trim() ||
      (rawStatus ? `Unexpected image status: ${rawStatus}` : "Image generation failed."),
    message: parsed.message,
    rawStatus: rawStatus || undefined,
  };
}

export function parseBienhinhImageResponseBody(
  responseBody: string,
): ParsedBienhinhImageResponse | null {
  try {
    return parseBienhinhImageResponse(JSON.parse(responseBody) as BienhinhImageApiResponse);
  } catch {
    return null;
  }
}

export function formatBienhinhImageToolResult(
  parsed: ParsedBienhinhImageResponse,
  httpStatus: number,
): string {
  if (parsed.status === "completed" && parsed.templateName && parsed.imageUrl) {
    return JSON.stringify({
      templateName: parsed.templateName,
      imageUrl: parsed.imageUrl,
    });
  }

  if (parsed.status === "pending" && parsed.requestId) {
    return JSON.stringify({
      status: "pending",
      requestId: parsed.requestId,
      queuePosition: parsed.queuePosition,
      message: parsed.message ?? "Image generation has been queued.",
    });
  }

  if (parsed.status === "failed") {
    return JSON.stringify({
      status: "failed",
      requestId: parsed.requestId,
      error: parsed.error ?? "Image generation failed.",
      ...(parsed.errorCode ? { errorCode: parsed.errorCode } : {}),
    });
  }

  return JSON.stringify({
    status: httpStatus,
    body: parsed,
  });
}

export async function fetchBienhinhImageRequest(
  requestId: string,
): Promise<ParsedBienhinhImageResponse> {
  const apiToken = getBienhinhApiToken();

  if (!apiToken) {
    return {
      status: "failed",
      requestId,
      error: "BIENHINH_API_TOKEN is not configured.",
    };
  }

  const response = await fetch(`${BIENHINH_IMAGES_API_URL}/${encodeURIComponent(requestId)}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${apiToken}`,
      Accept: "application/json, text/plain, */*",
    },
    cache: "no-store",
  });

  const responseBody = await response.text();
  const parsed = parseBienhinhImageResponseBody(responseBody);

  if (!parsed) {
    return {
      status: "failed",
      requestId,
      error: `Could not parse Bienhinh poll response (${response.status}).`,
    };
  }

  if (!response.ok && parsed.status !== "completed" && parsed.status !== "pending") {
    return {
      status: "failed",
      requestId,
      error: parsed.error ?? `Bienhinh poll request failed (${response.status}).`,
    };
  }

  return parsed;
}

export { BIENHINH_BASE_URL, BIENHINH_IMAGES_API_URL };
