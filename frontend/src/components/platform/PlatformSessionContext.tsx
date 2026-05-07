"use client";

import { createContext, useContext } from "react";

/**
 * Session shape exposed to client panels under `/platform/*`.
 * Values are populated by `PlatformAuthGate` after `/auth/me` succeeds.
 */
export type PlatformSessionUser = {
  id: string;
  email: string;
  displayName: string;
  role: string;
  photoUrl: string | null;
  companyName: string | null;
  businessPhone: string | null;
  businessEmail: string | null;
};

const PlatformSessionContext = createContext<PlatformSessionUser | null>(null);

export function PlatformSessionProvider({
  value,
  children,
}: {
  value: PlatformSessionUser;
  children: React.ReactNode;
}) {
  return <PlatformSessionContext.Provider value={value}>{children}</PlatformSessionContext.Provider>;
}

/**
 * Returns the platform session for the currently authed user.
 *
 * Throws if used outside `<PlatformAuthGate>` (which is mounted in the
 * platform layout). The gate guarantees the value is non-null whenever the
 * subtree renders, so consumers never need to null-check.
 */
export function usePlatformSession(): PlatformSessionUser {
  const ctx = useContext(PlatformSessionContext);
  if (!ctx) {
    throw new Error("usePlatformSession must be used within PlatformAuthGate.");
  }
  return ctx;
}
