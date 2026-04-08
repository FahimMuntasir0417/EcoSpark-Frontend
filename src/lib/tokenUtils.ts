export type JwtPayload = {
  exp?: number;
  iat?: number;
  role?: string;
  user?: {
    role?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

function decodeBase64Url(value: string): string {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);

  if (typeof atob !== "undefined") return atob(padded);

  return Buffer.from(padded, "base64").toString("utf-8");
}

export function parseJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;

    const json = decodeBase64Url(parts[1]);
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string, clockSkewSeconds = 30): boolean {
  const payload = parseJwtPayload(token);
  if (!payload?.exp) return true;

  const now = Math.floor(Date.now() / 1000);
  return payload.exp <= now + clockSkewSeconds;
}

export function extractUserRoleFromToken(token: string): string | null {
  const payload = parseJwtPayload(token);

  if (!payload) {
    return null;
  }

  const directRole = payload.role;
  if (typeof directRole === "string" && directRole.trim().length > 0) {
    return directRole;
  }

  const nestedRole = payload.user?.role;
  if (typeof nestedRole === "string" && nestedRole.trim().length > 0) {
    return nestedRole;
  }

  return null;
}
