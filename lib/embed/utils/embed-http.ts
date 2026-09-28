import { z } from "zod";

import { APIError } from "@/lib/exposers/api-error";

export function readEmbedClientKey(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  const clientKey = forwarded?.split(",")[0]?.trim();

  return clientKey || "unknown";
}

export function embedCorsHeaders(origin: string): Headers {
  const headers = new Headers();
  headers.set("Access-Control-Allow-Origin", origin);
  headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type");
  headers.set("Access-Control-Max-Age", "600");
  headers.set("Vary", "Origin");
  return headers;
}

export function withEmbedCors(response: Response, origin: string) {
  const headers = new Headers(response.headers);

  for (const [key, value] of embedCorsHeaders(origin).entries()) {
    headers.set(key, value);
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export function embedJson(body: unknown, status = 200) {
  return Response.json(body, { status });
}

export function embedErrorResponse(error: unknown) {
  if (error instanceof z.ZodError) {
    const message = error.issues[0]?.message ?? "Invalid input.";
    return embedJson({ error: "ERR_INVALID_INPUT", message }, 400);
  }

  if (error instanceof APIError) {
    return embedJson(
      { error: error.code, message: error.message },
      error.statusCode,
    );
  }

  console.error(error);
  return embedJson(
    { error: "ERR_INTERNAL", message: "Something went wrong." },
    500,
  );
}
