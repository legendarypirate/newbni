export type PlatformNavItem = {
  key: string;
  href: string;
  label: string;
  iconClass: string;
  /** Section heading (shown once when it changes); mirrors PHP sidebar blocks. */
  group: string;
};

/** Same order/labels as PHP `platform-home.php` sidebar (Mongolian). */
export const PLATFORM_SIDEBAR_NAV: PlatformNavItem[] = [
  { key: "dashboard", href: "/platform", label: "Хянах самбар", iconClass: "fa-solid fa-table-cells-large", group: "Үндсэн" },
  { key: "profile", href: "/platform/profile", label: "Бизнес Профайл", iconClass: "fa-regular fa-user", group: "Үндсэн" },
  { key: "media", href: "/platform/media", label: "Медиа сан", iconClass: "fa-regular fa-image", group: "Үндсэн" },
  { key: "jobs", href: "/platform/jobs", label: "Ажлын зар", iconClass: "fa-solid fa-briefcase", group: "Үндсэн" },
  { key: "events", href: "/platform/events", label: "Хурал / Эвент", iconClass: "fa-regular fa-calendar-check", group: "Менежмент" },
  { key: "trips", href: "/platform/trips", label: "Бизнес аялал", iconClass: "fa-solid fa-plane-departure", group: "Менежмент" },
  {
    key: "investments",
    href: "/platform/investments",
    label: "Хөрөнгө оруулалт",
    iconClass: "fa-solid fa-chart-line",
    group: "Менежмент",
  },
  { key: "news", href: "/platform/news", label: "Мэдээ", iconClass: "fa-regular fa-newspaper", group: "Менежмент" },
  { key: "partners", href: "/platform/partners", label: "Түншлэл", iconClass: "fa-solid fa-handshake", group: "Менежмент" },
  { key: "opportunities", href: "/platform/opportunities", label: "Боломжууд", iconClass: "fa-regular fa-lightbulb", group: "Менежмент" },
  { key: "busy_ai", href: "/busy-ai", label: "BUSY AI", iconClass: "fa-solid fa-wand-magic-sparkles", group: "Менежмент" },
  { key: "shop", href: "/platform/shop", label: "Дэлгүүр", iconClass: "fa-solid fa-cart-shopping", group: "Бусад" },
  { key: "shop_orders_in", href: "/platform/shop_orders_in", label: "Ирсэн захиалга", iconClass: "fa-solid fa-inbox", group: "Бусад" },
  { key: "shop_orders", href: "/platform/shop_orders", label: "Өгсөн захиалга", iconClass: "fa-solid fa-receipt", group: "Бусад" },
  { key: "premium", href: "/platform/premium", label: "Премиум", iconClass: "fa-solid fa-crown", group: "Сүлжээ" },
];

/** Slugs served by `/platform/[panel]` (excludes external links like `/busy-ai`). */
export const PLATFORM_PANEL_SLUGS = new Set(
  PLATFORM_SIDEBAR_NAV.filter((n) => n.href.startsWith("/platform/")).map((n) => n.key),
);
