"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { removeAuthToken, setAuthToken } from "@/lib/api-client";

export default function TokenHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const token = searchParams.get("token");
    const nextPath = searchParams.get("next");
    const oauthError = searchParams.get("error");
    if (token) {
      setAuthToken(token);
      // After storing token, continue to requested path (default platform).
      const safeNext =
        nextPath && nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/platform";
      router.replace(safeNext);
      return;
    }
    // If OAuth failed/cancelled, purge stale token so previous admin session is not reused.
    if (window.location.pathname.startsWith("/auth/login") && oauthError) {
      removeAuthToken();
      document.cookie = "bni_platform_account_id=; path=/; max-age=0";
      document.cookie = "bni_platform_account_ref=; path=/; max-age=0";
      document.cookie = "bni_platform_nav_display=; path=/; max-age=0";
    }
  }, [searchParams, router]);

  return null;
}
