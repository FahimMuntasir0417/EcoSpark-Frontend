"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE_KEYS } from "@/config/auth";
import { env } from "@/config/env";
import { loginInputSchema, type LoginInput } from "@/contracts/auth.contract";
import {
  normalizeUserRole,
  type UserRole,
} from "@/lib/authUtils";
import { APP_ROUTES } from "@/lib/navigation/redirect-policy";
import { extractUserRoleFromToken, parseJwtPayload } from "@/lib/tokenUtils";

type AuthPayload = {
  accessToken?: string;
  refreshToken?: string;
  role?: string;
};

const API_BASE_URL = env.NEXT_PUBLIC_API_BASE_URL.replace(/\/+$/, "");

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function readMessage(value: unknown, fallback: string): string {
  if (!isRecord(value)) {
    return fallback;
  }

  const message = value.message;

  if (typeof message === "string" && message.trim().length > 0) {
    return message;
  }

  return fallback;
}

function isApiFailure(value: unknown): boolean {
  if (!isRecord(value)) {
    return false;
  }

  return value.success === false;
}

function extractAuthPayload(source: unknown): AuthPayload {
  if (!isRecord(source)) {
    return {};
  }

  const candidate = isRecord(source.data) ? source.data : source;

  const user = isRecord(candidate.user) ? candidate.user : undefined;

  return {
    accessToken:
      (typeof candidate.accessToken === "string" && candidate.accessToken) ||
      (typeof candidate.access_token === "string" && candidate.access_token) ||
      (typeof candidate.token === "string" && candidate.token) ||
      undefined,
    refreshToken:
      (typeof candidate.refreshToken === "string" && candidate.refreshToken) ||
      (typeof candidate.refresh_token === "string" &&
        candidate.refresh_token) ||
      undefined,
    role:
      (typeof candidate.role === "string" && candidate.role) ||
      (user && typeof user.role === "string" && user.role) ||
      undefined,
  };
}

function getTokenMaxAgeSeconds(token: string): number | undefined {
  const payload = parseJwtPayload(token);

  if (!payload?.exp) {
    return undefined;
  }

  const nowInSeconds = Math.floor(Date.now() / 1000);
  const maxAge = payload.exp - nowInSeconds;

  if (maxAge <= 0) {
    return undefined;
  }

  return maxAge;
}

function resolvePostLoginTarget(
  requestedRedirect: string | null | undefined,
  role: string | null,
): string {
  void requestedRedirect;
  void role;
  return APP_ROUTES.home;
}

async function requestLogin(input: LoginInput): Promise<AuthPayload> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
    cache: "no-store",
  });

  let responseBody: unknown = null;

  try {
    responseBody = await response.json();
  } catch {
    responseBody = null;
  }

  const responseMessage = readMessage(
    responseBody,
    response.ok ? "Login successful." : "Login failed.",
  );

  if (!response.ok || isApiFailure(responseBody)) {
    throw new Error(responseMessage);
  }

  const authPayload = extractAuthPayload(responseBody);

  if (!authPayload.accessToken) {
    throw new Error("Login succeeded but access token is missing in response.");
  }

  return authPayload;
}

async function persistServerAuthCookies(
  authPayload: AuthPayload,
): Promise<UserRole | null> {
  const cookieStore = await cookies();

  if (authPayload.accessToken) {
    cookieStore.set(AUTH_COOKIE_KEYS.accessToken, authPayload.accessToken, {
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: getTokenMaxAgeSeconds(authPayload.accessToken),
    });
  }

  if (authPayload.refreshToken) {
    cookieStore.set(AUTH_COOKIE_KEYS.refreshToken, authPayload.refreshToken, {
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
    });
  }

  const extractedRole =
    authPayload.role ??
    (authPayload.accessToken
      ? extractUserRoleFromToken(authPayload.accessToken)
      : null);

  const normalizedRole = normalizeUserRole(extractedRole);

  if (normalizedRole) {
    cookieStore.set(AUTH_COOKIE_KEYS.userRole, normalizedRole, {
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
    });
  }

  return normalizedRole;
}

export async function loginAndRedirectAction(
  input: LoginInput,
  requestedRedirect?: string | null,
): Promise<never> {
  const validatedInput = loginInputSchema.parse(input);
  const authPayload = await requestLogin(validatedInput);
  const role = await persistServerAuthCookies(authPayload);
  const target = resolvePostLoginTarget(requestedRedirect, role);

  redirect(target);
}

export async function loginAndRedirectFromFormAction(
  formData: FormData,
): Promise<never> {
  const emailValue = formData.get("email");
  const passwordValue = formData.get("password");
  const redirectValue = formData.get("redirect");

  const input = loginInputSchema.parse({
    email: typeof emailValue === "string" ? emailValue : "",
    password: typeof passwordValue === "string" ? passwordValue : "",
  });

  const requestedRedirect =
    typeof redirectValue === "string" ? redirectValue : null;

  const authPayload = await requestLogin(input);
  const role = await persistServerAuthCookies(authPayload);
  const target = resolvePostLoginTarget(requestedRedirect, role);

  redirect(target);
}
