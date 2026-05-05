export function readBniTokenFromCookieHeader(cookieHeader: string | null | undefined): string | null {
  if (!cookieHeader) return null;
  const tokenCookie = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("bni_token="));
  return tokenCookie ? decodeURIComponent(tokenCookie.split("=")[1] || "") : null;
}
