function normalizeApiUrl(raw: string | undefined): string {
  const base = (raw || "").replace(/\/$/, "");
  if (!base) return "";
  return base.endsWith("/api") ? base : `${base}/api`;
}

function runtimeApiUrl(): string {
  const fromEnv = normalizeApiUrl(process.env.NEXT_PUBLIC_API_URL);
  if (fromEnv) return fromEnv;

  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host === "test.busy.mn") return "https://testapi.busy.mn/api";
    if (host === "busy.mn" || host === "www.busy.mn") return "https://api.busy.mn/api";
  }

  const internal = normalizeApiUrl(process.env.API_INTERNAL_URL);
  if (internal) return internal;
  return "http://localhost:3001/api";
}

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
  // Also set cookie for server-side access
  document.cookie = `bni_token=${token}; path=/; max-age=2592000; SameSite=Lax`;
}

export function removeAuthToken() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("bni_token");
  document.cookie = "bni_token=; path=/; max-age=0";
}

export async function apiFetch(path: string, options: RequestInit = {}, cookieHeader?: string) {
  const API_URL = runtimeApiUrl();
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
