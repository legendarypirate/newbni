"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { setAuthToken } from "@/lib/api-client";

export default function TokenHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      setAuthToken(token);
      const newParams = new URLSearchParams(searchParams.toString());
      newParams.delete("token");
      const cleanUrl = window.location.pathname + (newParams.toString() ? "?" + newParams.toString() : "");
      router.replace(cleanUrl);
    }
  }, [searchParams, router]);

  return null;
}
