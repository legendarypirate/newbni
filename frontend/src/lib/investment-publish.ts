/** Where founders build / publish an investment listing (Pitch Deck tab). */
export const INVESTMENT_PUBLISH_PATH = "/investments?tab=pitchdeck";

export function investmentPublishLoginPath(): string {
  return `/auth/login?next=${encodeURIComponent(INVESTMENT_PUBLISH_PATH)}`;
}
