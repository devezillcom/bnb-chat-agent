import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import type { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";

import { APIError } from "@/lib/exposers/api-error";
import { decryptSecretContent } from "@/lib/secret-data-store/utils/decrypt-secret-content";
import { encryptSecretContent } from "@/lib/secret-data-store/utils/encrypt-secret-content";

import {
  FACEBOOK_OAUTH_COOKIE_MAX_AGE_SECONDS,
  FACEBOOK_OAUTH_STATE_COOKIE,
  FACEBOOK_PENDING_OAUTH_COOKIE,
} from "../constants";
import type {
  FacebookOAuthStateData,
  FacebookPendingOAuthData,
} from "../types";

function getCookieOptions(
  maxAge = FACEBOOK_OAUTH_COOKIE_MAX_AGE_SECONDS,
): Partial<ResponseCookie> {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  };
}

function encryptPendingOAuthData(data: FacebookPendingOAuthData) {
  return encryptSecretContent(JSON.stringify(data));
}

function encryptOAuthStateData(data: FacebookOAuthStateData) {
  return encryptSecretContent(JSON.stringify(data));
}

export function applyFacebookOAuthStateCookie(
  response: NextResponse,
  data: FacebookOAuthStateData,
) {
  response.cookies.set(
    FACEBOOK_OAUTH_STATE_COOKIE,
    encryptOAuthStateData(data),
    getCookieOptions(),
  );
  return response;
}

export function applyFacebookPendingOAuthCookie(
  response: NextResponse,
  data: FacebookPendingOAuthData,
) {
  response.cookies.set(
    FACEBOOK_PENDING_OAUTH_COOKIE,
    encryptPendingOAuthData(data),
    getCookieOptions(),
  );
  return response;
}

export function clearFacebookOAuthStateCookie(response: NextResponse) {
  response.cookies.delete(FACEBOOK_OAUTH_STATE_COOKIE);
  return response;
}

export function clearFacebookPendingOAuthCookie(response: NextResponse) {
  response.cookies.delete(FACEBOOK_PENDING_OAUTH_COOKIE);
  return response;
}

export async function readFacebookOAuthStateData(
  userId: string,
): Promise<FacebookOAuthStateData> {
  const cookieStore = await cookies();
  const value = cookieStore.get(FACEBOOK_OAUTH_STATE_COOKIE)?.value;

  if (!value) {
    throw new APIError(
      "ERR_FACEBOOK_CONNECT_EXPIRED",
      "Facebook connection expired. Please connect again.",
      400,
    );
  }

  try {
    const data = JSON.parse(
      decryptSecretContent(value),
    ) as FacebookOAuthStateData;

    if (data.userId !== userId) {
      throw new APIError(
        "ERR_FACEBOOK_CONNECT_EXPIRED",
        "Facebook connection expired. Please connect again.",
        400,
      );
    }

    return data;
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }

    throw new APIError(
      "ERR_FACEBOOK_CONNECT_EXPIRED",
      "Facebook connection expired. Please connect again.",
      400,
    );
  }
}

export async function readFacebookPendingOAuthData(
  userId: string,
): Promise<FacebookPendingOAuthData> {
  const cookieStore = await cookies();
  const value = cookieStore.get(FACEBOOK_PENDING_OAUTH_COOKIE)?.value;

  if (!value) {
    throw new APIError(
      "ERR_FACEBOOK_CONNECT_EXPIRED",
      "Facebook connection expired. Please connect again.",
      400,
    );
  }

  try {
    const data = JSON.parse(
      decryptSecretContent(value),
    ) as FacebookPendingOAuthData;

    if (data.userId !== userId) {
      throw new APIError(
        "ERR_FACEBOOK_CONNECT_EXPIRED",
        "Facebook connection expired. Please connect again.",
        400,
      );
    }

    return data;
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }

    throw new APIError(
      "ERR_FACEBOOK_CONNECT_EXPIRED",
      "Facebook connection expired. Please connect again.",
      400,
    );
  }
}
