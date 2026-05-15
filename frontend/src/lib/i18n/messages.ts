import type { BniLangCode } from "@/lib/nav-php-parity";

export type MessageKey =
  | "nav.trips"
  | "nav.events"
  | "nav.companies"
  | "nav.investments"
  | "nav.members"
  | "nav.news"
  | "nav.busyAi"
  | "nav.switchLang"
  | "auth.login"
  | "auth.register"
  | "auth.logout"
  | "auth.greeting"
  | "auth.platform"
  | "auth.admin"
  | "footer.contact"
  | "footer.usefulLinks"
  | "footer.platform"
  | "trips.title"
  | "trips.subtitle"
  | "trips.filter.search"
  | "trips.stats.total"
  | "trips.stats.near"
  | "trips.stats.members"
  | "events.title"
  | "events.upcoming"
  | "events.past"
  | "news.title"
  | "common.loading"
  | "common.readMore"
  | "common.noResults";

type Catalog = Record<MessageKey, string>;

const mn: Catalog = {
  "nav.trips": "Бизнес аялал",
  "nav.events": "Хурал/Эвент",
  "nav.companies": "Үйлдвэр холболт",
  "nav.investments": "Хөрөнгө оруулалт",
  "nav.members": "Гишүүд",
  "nav.news": "Мэдээлэл",
  "nav.busyAi": "BUSY AI",
  "nav.switchLang": "Хэл солих",
  "auth.login": "Нэвтрэх",
  "auth.register": "Бүртгүүлэх",
  "auth.logout": "Гарах",
  "auth.greeting": "Сайн байна уу",
  "auth.platform": "Platform",
  "auth.admin": "Admin",
  "footer.contact": "Холбоо барих",
  "footer.usefulLinks": "Хэрэгтэй холбоосууд",
  "footer.platform": "Платформ",
  "trips.title": "Бизнес аялал",
  "trips.subtitle": "Олон улсын бизнес аялал, үйлдвэр үзэх, хөрөнгө оруулалтын боломжууд",
  "trips.filter.search": "Хайх",
  "trips.stats.total": "Нийт аялал",
  "trips.stats.near": "Ойрын аялал",
  "trips.stats.members": "Бүртгүүдсэн гишүүн",
  "events.title": "Хурал / Эвент",
  "events.upcoming": "Удахгүй",
  "events.past": "Өнгөрсөн",
  "news.title": "Мэдээлэл",
  "common.loading": "Ачаалж байна…",
  "common.readMore": "Дэлгэрэнгүй",
  "common.noResults": "Олдсонгүй",
};

const en: Catalog = {
  "nav.trips": "Business trips",
  "nav.events": "Meetings / Events",
  "nav.companies": "Factory connections",
  "nav.investments": "Investments",
  "nav.members": "Members",
  "nav.news": "News",
  "nav.busyAi": "BUSY AI",
  "nav.switchLang": "Change language",
  "auth.login": "Log in",
  "auth.register": "Sign up",
  "auth.logout": "Log out",
  "auth.greeting": "Hello",
  "auth.platform": "Platform",
  "auth.admin": "Admin",
  "footer.contact": "Contact",
  "footer.usefulLinks": "Useful links",
  "footer.platform": "Platform",
  "trips.title": "Business trips",
  "trips.subtitle": "International business travel, factory visits, and investment opportunities",
  "trips.filter.search": "Search",
  "trips.stats.total": "Total trips",
  "trips.stats.near": "Upcoming soon",
  "trips.stats.members": "Registered members",
  "events.title": "Meetings / Events",
  "events.upcoming": "Upcoming",
  "events.past": "Past",
  "news.title": "News",
  "common.loading": "Loading…",
  "common.readMore": "Read more",
  "common.noResults": "No results",
};

const cn: Catalog = {
  "nav.trips": "商务旅行",
  "nav.events": "会议/活动",
  "nav.companies": "工厂对接",
  "nav.investments": "投资",
  "nav.members": "会员",
  "nav.news": "资讯",
  "nav.busyAi": "BUSY AI",
  "nav.switchLang": "切换语言",
  "auth.login": "登录",
  "auth.register": "注册",
  "auth.logout": "退出",
  "auth.greeting": "您好",
  "auth.platform": "平台",
  "auth.admin": "管理",
  "footer.contact": "联系方式",
  "footer.usefulLinks": "实用链接",
  "footer.platform": "平台",
  "trips.title": "商务旅行",
  "trips.subtitle": "国际商务旅行、工厂考察与投资机会",
  "trips.filter.search": "搜索",
  "trips.stats.total": "旅行总数",
  "trips.stats.near": "近期行程",
  "trips.stats.members": "注册会员",
  "events.title": "会议 / 活动",
  "events.upcoming": "即将举行",
  "events.past": "已结束",
  "news.title": "资讯",
  "common.loading": "加载中…",
  "common.readMore": "了解更多",
  "common.noResults": "未找到结果",
};

const kr: Catalog = {
  "nav.trips": "비즈니스 여행",
  "nav.events": "회의/이벤트",
  "nav.companies": "공장 연결",
  "nav.investments": "투자",
  "nav.members": "회원",
  "nav.news": "뉴스",
  "nav.busyAi": "BUSY AI",
  "nav.switchLang": "언어 변경",
  "auth.login": "로그인",
  "auth.register": "회원가입",
  "auth.logout": "로그아웃",
  "auth.greeting": "안녕하세요",
  "auth.platform": "플랫폼",
  "auth.admin": "관리자",
  "footer.contact": "연락처",
  "footer.usefulLinks": "유용한 링크",
  "footer.platform": "플랫폼",
  "trips.title": "비즈니스 여행",
  "trips.subtitle": "국제 비즈니스 여행, 공장 방문 및 투자 기회",
  "trips.filter.search": "검색",
  "trips.stats.total": "총 여행",
  "trips.stats.near": "임박 일정",
  "trips.stats.members": "등록 회원",
  "events.title": "회의 / 이벤트",
  "events.upcoming": "예정",
  "events.past": "지난",
  "news.title": "뉴스",
  "common.loading": "로딩 중…",
  "common.readMore": "자세히",
  "common.noResults": "결과 없음",
};

const jp: Catalog = {
  "nav.trips": "ビジネス旅行",
  "nav.events": "会議/イベント",
  "nav.companies": "工場マッチング",
  "nav.investments": "投資",
  "nav.members": "メンバー",
  "nav.news": "ニュース",
  "nav.busyAi": "BUSY AI",
  "nav.switchLang": "言語を変更",
  "auth.login": "ログイン",
  "auth.register": "登録",
  "auth.logout": "ログアウト",
  "auth.greeting": "こんにちは",
  "auth.platform": "プラットフォーム",
  "auth.admin": "管理",
  "footer.contact": "お問い合わせ",
  "footer.usefulLinks": "便利なリンク",
  "footer.platform": "プラットフォーム",
  "trips.title": "ビジネス旅行",
  "trips.subtitle": "国際ビジネス旅行、工場見学、投資機会",
  "trips.filter.search": "検索",
  "trips.stats.total": "旅行総数",
  "trips.stats.near": "近日日程",
  "trips.stats.members": "登録メンバー",
  "events.title": "会議 / イベント",
  "events.upcoming": "開催予定",
  "events.past": "終了",
  "news.title": "ニュース",
  "common.loading": "読み込み中…",
  "common.readMore": "続きを読む",
  "common.noResults": "見つかりません",
};

export const MESSAGE_CATALOG: Record<BniLangCode, Catalog> = { mn, en, cn, kr, jp };

export function translateUi(lang: BniLangCode, key: MessageKey): string {
  return MESSAGE_CATALOG[lang]?.[key] ?? MESSAGE_CATALOG.mn[key] ?? key;
}
