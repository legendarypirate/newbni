/** Where founders manage pitch deck and investment listings inside the platform. */
export const INVESTMENT_PUBLISH_PATH = "/platform/investments";

export function investmentPublishLoginPath(): string {
  return `/auth/login?next=${encodeURIComponent(INVESTMENT_PUBLISH_PATH)}`;
}
