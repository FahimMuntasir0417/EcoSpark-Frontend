"use client";

import { useRef } from "react";
import { persistAuthSession } from "@/lib/auth/session";

type PublicAuthSessionSyncProps = {
  accessToken: string | null;
  refreshToken: string | null;
  role: string | null;
};

export function PublicAuthSessionSync({
  accessToken,
  refreshToken,
  role,
}: PublicAuthSessionSyncProps) {
  const lastSyncedKeyRef = useRef<string | null>(null);
  const syncKey = accessToken ? `${accessToken}:${refreshToken ?? ""}:${role ?? ""}` : null;

  if (
    typeof window !== "undefined" &&
    accessToken &&
    syncKey &&
    lastSyncedKeyRef.current !== syncKey
  ) {
    persistAuthSession({
      accessToken,
      refreshToken: refreshToken ?? undefined,
      role: role ?? undefined,
    });
    lastSyncedKeyRef.current = syncKey;
  }

  return null;
}
