/** Hidden form field set by client forms so Server Actions can use the JWT from `localStorage`. */
export const PLATFORM_AUTH_TOKEN_FIELD = "_platform_auth_token";

export function readPlatformAuthTokenFromFormData(formData: FormData | null | undefined): string | null {
  if (!formData) return null;
  const raw = String(formData.get(PLATFORM_AUTH_TOKEN_FIELD) ?? "").trim();
  return raw || null;
}
