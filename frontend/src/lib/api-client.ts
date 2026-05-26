import { publicApiBase } from "@/lib/client-api-base";

export function getAuthToken(cookieHeader?: string) {
  if (typeof window === "undefined") {
    if (!cookieHeader) return null;
    const tokenCookie = cookieHeader
      .split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith("bni_token="));
    return tokenCookie ? decodeURIComponent(tokenCookie.split("=")[1] || "") : null;
  }

  return (
    localStorage.getItem("bni_token") ||
    document.cookie
      .split("; ")
      .find((row) => row.startsWith("bni_token="))
      ?.split("=")[1] ||
    null
  );
}

export function setAuthToken(token: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem("bni_token", token);
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `bni_token=${encodeURIComponent(token)}; path=/; max-age=2592000; SameSite=Lax${secure}`;
  void fetch("/api/auth/establish-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
    credentials: "same-origin",
  }).catch(() => {
    /* non-blocking; Server Actions also accept `_platform_auth_token` */
  });
}

export function removeAuthToken() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("bni_token");
  document.cookie = "bni_token=; path=/; max-age=0";
}

export async function apiFetch(path: string, options: RequestInit = {}, cookieHeader?: string) {
  const API_URL = publicApiBase();
  const token = getAuthToken(cookieHeader);
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401 || res.status === 403) {
    // Optional: handle logout on token expiry
    // removeAuthToken();
    // window.location.href = "/auth/login";
  }

  return res;
}
