"use client";

import { useEffect, useState } from "react";
import { PLATFORM_AUTH_TOKEN_FIELD } from "@/lib/platform-auth-token-field";

/** Mirrors `localStorage` JWT into Server Action posts when httpOnly cookies are absent. */
export default function PlatformAuthTokenField() {
  const [token, setToken] = useState("");

  useEffect(() => {
    try {
      setToken(window.localStorage.getItem("bni_token") || "");
    } catch {
      setToken("");
    }
  }, []);

  return <input type="hidden" name={PLATFORM_AUTH_TOKEN_FIELD} value={token} />;
}
