"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api-client";

type GrowthHint = { pctLabel: string; tone: "up" | "down" | "neutral"; sublabel: string };

type Metrics = {
  totalEvents: number;
  eventGrowth: GrowthHint;
  upcomingNext30d: number;
  totalRegistrations: number;
  registrationGrowth: GrowthHint;
  attendancePresent: number;
  attendanceTotal: number;
  attendancePct: number | null;
  revenueTotalMnt: number;
  revenueGrowth: GrowthHint;
  pendingApprovals: number;
};

type RecentAttendee = {
  id: string;
  fullName: string;
  company: string;
  status: string;
  paymentStatus: string;
  createdAt: string;
};

type DashboardPayload = {
  scope: "user" | "admin";
  metrics: Metrics;
  funnel: { interested: number; registered: number; paid: number; attended: number };
  statusBreakdown: {
    confirmed: number;
    pending: number;
    attended: number;
    cancelled: number;
    total: number;
  };
  recentAttendees: RecentAttendee[];
  topEvents: { title: string; count: number }[];
  tickets: { label: string; priceMnt: number; free: boolean; active: boolean }[];
  schedule: { time: string; title: string }[];
  sparkline: number[];
  revenueLast30: number;
};

const EMPTY_METRICS: Metrics = {
  totalEvents: 0,
  eventGrowth: { pctLabel: "0%", tone: "neutral", sublabel: "" },
  upcomingNext30d: 0,
  totalRegistrations: 0,
  registrationGrowth: { pctLabel: "0%", tone: "neutral", sublabel: "" },
  attendancePresent: 0,
  attendanceTotal: 0,
  attendancePct: null,
  revenueTotalMnt: 0,
  revenueGrowth: { pctLabel: "0%", tone: "neutral", sublabel: "" },
  pendingApprovals: 0,
};

function formatInteger(n: number): string {
  return Math.round(n).toLocaleString("mn-MN");
}

function formatMoney(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "0₮";
  return `${Math.round(n).toLocaleString("mn-MN")}₮`;
}

function formatPct(numerator: number, denominator: number): string {
  if (denominator <= 0) return "0%";
  return `${Math.round((numerator / denominator) * 100)}%`;
}

function GrowthMeta({ hint }: { hint: GrowthHint }) {
  const tone = hint.tone;
  const toneClass = tone === "up" || (tone === "neutral" && hint.pctLabel === "Шинэ") ? "up" : tone === "down" ? "down" : "";
  const showCaret = tone === "up" || tone === "down";
  return (
    <div className={`pl-org-metric-meta${toneClass ? ` ${toneClass}` : ""}`.trim()}>
      {showCaret ? (
        <>
          <i className={`fa-solid fa-caret-${tone === "up" ? "up" : "down"}`} /> {hint.pctLabel}{" "}
        </>
      ) : (
        <>{hint.pctLabel ? `${hint.pctLabel} ` : null}</>
      )}
      <span className="text-muted fw-normal">{hint.sublabel}</span>
    </div>
  );
}

function DonutChart({ confirmed, pending, attended, cancelled }: { confirmed: number; pending: number; attended: number; cancelled: number }) {
  const total = confirmed + pending + attended + cancelled;
  if (total <= 0) {
    return (
      <div style={{ position: "relative", width: 130, height: 130, margin: "0 auto" }}>
        <svg viewBox="0 0 36 36" style={{ width: "100%", height: "100%" }}>
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f1f5f9" strokeWidth="3" />
        </svg>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center" }}>
          <div className="fw-bold" style={{ fontSize: "1.1rem" }}>0</div>
          <div className="smaller text-muted">Нийт</div>
        </div>
      </div>
    );
  }
  const segments = [
    { value: confirmed, color: "#10b981" },
    { value: pending, color: "#f59e0b" },
    { value: attended, color: "#3b82f6" },
    { value: cancelled, color: "#ef4444" },
  ];
  let offset = 0;
  return (
    <div style={{ position: "relative", width: 130, height: 130, margin: "0 auto" }}>
      <svg viewBox="0 0 36 36" style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
        <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f1f5f9" strokeWidth="3" />
        {segments.map((seg, i) => {
          const pct = (seg.value / total) * 100;
          const dash = `${pct} ${100 - pct}`;
          const node = (
            <circle
              key={i}
              cx="18"
              cy="18"
              r="15.9"
              fill="none"
              stroke={seg.color}
              strokeWidth="3"
              strokeDasharray={dash}
              strokeDashoffset={-offset}
            />
          );
          offset += pct;
          return node;
        })}
      </svg>
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center" }}>
        <div className="fw-bold" style={{ fontSize: "1.1rem" }}>{formatInteger(total)}</div>
        <div className="smaller text-muted">Нийт</div>
      </div>
    </div>
  );
}

function Sparkline({ values }: { values: number[] }) {
  const w = 280;
  const h = 80;
  const max = Math.max(1, ...values);
  const step = w / Math.max(1, values.length - 1);
  const points = values
    .map((v, i) => `${Math.round(i * step)},${Math.round(h - (v / max) * (h - 10) - 5)}`)
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h}>
      <polyline fill="none" stroke="#2563eb" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" points={points} />
    </svg>
  );
}

export default function DashboardPanel() {
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch("/platform/dashboard");
        if (!res.ok) {
          if (!cancelled) setError("Хяналтын самбарын мэдээлэл татаж чадсангүй.");
          return;
        }
        const json = (await res.json()) as { ok?: boolean; data?: DashboardPayload };
        if (!cancelled) {
          if (json.ok && json.data) setData(json.data);
          else setError("Хяналтын самбарын мэдээлэл татаж чадсангүй.");
        }
      } catch {
        if (!cancelled) setError("Сүлжээний алдаа.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const metrics = data?.metrics ?? EMPTY_METRICS;
  const funnel = data?.funnel ?? { interested: 0, registered: 0, paid: 0, attended: 0 };
  const statusBreakdown = data?.statusBreakdown ?? { confirmed: 0, pending: 0, attended: 0, cancelled: 0, total: 0 };
  const recentAttendees = data?.recentAttendees ?? [];
  const topEvents = data?.topEvents ?? [];
  const tickets = data?.tickets ?? [];
  const schedule = data?.schedule ?? [];
  const sparkline = data?.sparkline ?? [0, 0, 0, 0, 0, 0, 0];
  const revenueLast30 = data?.revenueLast30 ?? 0;

  const lastWeekRegs = useMemo(() => sparkline.reduce((sum, n) => sum + n, 0), [sparkline]);

  return (
    <div className="pl-main-grid">
      <div className="pl-main-content">
        <h1 className="pl-main-title">Зохион байгуулагчийн булан</h1>
        <p className="pl-main-desc mb-4">
          Арга хэмжээ үүсгэх, оролцогч бүртгэх, хуваарь удирдах, тайлан авах цогц удирдлагын систем.
        </p>

        {error ? <div className="alert alert-warning small py-2 mb-3">{error}</div> : null}

        <div className="pl-org-metric-grid">
          <div className="pl-org-metric-card">
            <div className="pl-org-metric-label">
              <i className="fa-regular fa-calendar-check" /> Нийт арга хэмжээ
            </div>
            <div className="pl-org-metric-val">{formatInteger(metrics.totalEvents)}</div>
            <GrowthMeta hint={metrics.eventGrowth} />
          </div>
          <div className="pl-org-metric-card">
            <div className="pl-org-metric-label">
              <i className="fa-regular fa-clock" /> Удахгүй болох
            </div>
            <div className="pl-org-metric-val">{formatInteger(metrics.upcomingNext30d)}</div>
            <div className="pl-org-metric-meta text-muted">Дараагийн 30 хоногт</div>
          </div>
          <div className="pl-org-metric-card">
            <div className="pl-org-metric-label">
              <i className="fa-regular fa-user" /> Нийт бүртгэл
            </div>
            <div className="pl-org-metric-val">{formatInteger(metrics.totalRegistrations)}</div>
            <GrowthMeta hint={metrics.registrationGrowth} />
          </div>
          <div className="pl-org-metric-card">
            <div className="pl-org-metric-label">
              <i className="fa-regular fa-circle-check" /> Баталгаажсан
            </div>
            <div className="pl-org-metric-val">{formatInteger(metrics.attendancePresent)}</div>
            <div className="pl-org-metric-meta" style={{ color: "#10b981" }}>
              {metrics.attendancePct != null ? (
                <>
                  <b>{metrics.attendancePct}%</b>{" "}
                  <span className="text-muted fw-normal">баталгаажсан хувь</span>
                </>
              ) : (
                <span className="text-muted fw-normal">Өгөгдөл байхгүй</span>
              )}
            </div>
          </div>
          <div className="pl-org-metric-card">
            <div className="pl-org-metric-label">
              <i className="fa-solid fa-coins" /> Нийт орлого
            </div>
            <div className="pl-org-metric-val" style={{ fontSize: "1rem" }}>
              {formatMoney(metrics.revenueTotalMnt)}
            </div>
            <GrowthMeta hint={metrics.revenueGrowth} />
          </div>
          <div className="pl-org-metric-card">
            <div className="pl-org-metric-label">
              <i className="fa-regular fa-hourglass-half" /> Хүлээгдэж буй
            </div>
            <div className="pl-org-metric-val">{formatInteger(metrics.pendingApprovals)}</div>
            <div className="pl-org-metric-meta text-warning">Хариулт, төлбөр шалгах</div>
          </div>
        </div>

        <div className="pl-btn-row">
          <Link href="/platform/events" className="btn-pl text-decoration-none">
            <i className="fa-solid fa-plus" /> Шинэ арга хэмжээ үүсгэх
          </Link>
          <a
            href="#"
            className="btn-pl btn-pl-placeholder text-decoration-none"
            aria-disabled="true"
            onClick={(e) => e.preventDefault()}
          >
            <i className="fa-solid fa-b" style={{ color: "#e63946" }} /> BNI хурал үүсгэх
          </a>
          <a
            href="#"
            className="btn-pl btn-pl-placeholder text-decoration-none"
            aria-disabled="true"
            onClick={(e) => e.preventDefault()}
          >
            <i className="fa-solid fa-m" style={{ color: "#7c3aed" }} /> MEGA Visitor үүсгэх
          </a>
          <Link href="/platform/trips" className="btn-pl btn-pl-trip text-decoration-none">
            <i className="fa-solid fa-plane-up" /> Аялал нэмэх
          </Link>
        </div>

        <div className="pl-analytics-grid">
          <div className="pl-analytics-card">
            <div className="pl-widget-head">
              <span>Бүртгэлийн суваг (Funnel)</span>
            </div>
            <div className="pl-funnel-layout">
              <div className="pl-funnel-visual">
                <div className="pl-funnel-layer l1" />
                <div className="pl-funnel-layer l2" />
                <div className="pl-funnel-layer l3" />
                <div className="pl-funnel-layer l4" />
              </div>
              <div className="pl-funnel-legend">
                <div className="pl-funnel-legend-item">
                  <span>Нийт сонирхсон</span>
                  <b>{formatInteger(funnel.interested)}</b>
                </div>
                <div className="pl-funnel-legend-item">
                  <span>Бүртгүүлсэн</span>
                  <b>
                    {formatInteger(funnel.registered)} ({formatPct(funnel.registered, Math.max(funnel.interested, funnel.registered))})
                  </b>
                </div>
                <div className="pl-funnel-legend-item">
                  <span>Төлбөр төлсөн</span>
                  <b>
                    {formatInteger(funnel.paid)} ({formatPct(funnel.paid, Math.max(funnel.registered, 1))})
                  </b>
                </div>
                <div className="pl-funnel-legend-item">
                  <span>Баталгаажсан</span>
                  <b>
                    {formatInteger(funnel.attended)} ({formatPct(funnel.attended, Math.max(funnel.registered, 1))})
                  </b>
                </div>
              </div>
            </div>
          </div>
          <div className="pl-analytics-card">
            <div className="pl-widget-head">
              <span>Оролцогчийн статус</span>
            </div>
            <div className="pl-donut-wrap">
              <DonutChart
                confirmed={statusBreakdown.confirmed}
                pending={statusBreakdown.pending}
                attended={statusBreakdown.attended}
                cancelled={statusBreakdown.cancelled}
              />
              <div className="pl-donut-legend">
                <div className="pl-donut-legend-item">
                  <span>
                    <span className="pl-donut-dot" style={{ background: "#10b981" }} />
                    Баталгаажсан
                  </span>
                  <span>
                    {formatInteger(statusBreakdown.confirmed)} ({formatPct(statusBreakdown.confirmed, Math.max(statusBreakdown.total, 1))})
                  </span>
                </div>
                <div className="pl-donut-legend-item">
                  <span>
                    <span className="pl-donut-dot" style={{ background: "#f59e0b" }} />
                    Хүлээгдэж буй
                  </span>
                  <span>
                    {formatInteger(statusBreakdown.pending)} ({formatPct(statusBreakdown.pending, Math.max(statusBreakdown.total, 1))})
                  </span>
                </div>
                <div className="pl-donut-legend-item">
                  <span>
                    <span className="pl-donut-dot" style={{ background: "#3b82f6" }} />
                    Ирсэн
                  </span>
                  <span>
                    {formatInteger(statusBreakdown.attended)} ({formatPct(statusBreakdown.attended, Math.max(statusBreakdown.total, 1))})
                  </span>
                </div>
                <div className="pl-donut-legend-item">
                  <span>
                    <span className="pl-donut-dot" style={{ background: "#ef4444" }} />
                    Цуцлагдсан
                  </span>
                  <span>
                    {formatInteger(statusBreakdown.cancelled)} ({formatPct(statusBreakdown.cancelled, Math.max(statusBreakdown.total, 1))})
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="pl-analytics-card">
            <div className="pl-split-card">
              <div>
                <div className="pl-widget-head">
                  <span>Сүүлийн оролцогчид</span>
                  <Link href="/platform/trips" className="smaller text-primary text-decoration-none">
                    Бүгдийг харах
                  </Link>
                </div>
                <div className="pl-attendee-list">
                  {recentAttendees.length === 0 ? (
                    <div className="text-center text-muted small py-3">Оролцогч бүртгэгдээгүй.</div>
                  ) : (
                    recentAttendees.map((a) => (
                      <div className="pl-attendee-item" key={a.id}>
                        <div
                          className="rounded-circle d-flex align-items-center justify-content-center bg-light text-muted"
                          style={{ width: 32, height: 32, fontSize: "0.7rem" }}
                          aria-hidden="true"
                        >
                          {(a.fullName || "?").trim().charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-grow-1">
                          <div className="fw-bold smaller">{a.fullName}</div>
                          <div className="smaller text-muted">{a.company || "—"}</div>
                        </div>
                        <span
                          className="pl-badge"
                          style={{
                            background:
                              a.status === "CONFIRMED" ? "#ecfdf5" : a.status === "CANCELLED" ? "#fef2f2" : "#fff7ed",
                            color:
                              a.status === "CONFIRMED" ? "#10b981" : a.status === "CANCELLED" ? "#ef4444" : "#f97316",
                            fontSize: "0.65rem",
                          }}
                        >
                          {a.status === "CONFIRMED"
                            ? "Баталгаажсан"
                            : a.status === "CANCELLED"
                              ? "Цуцлагдсан"
                              : "Хүлээгдэж буй"}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div>
                <div className="pl-widget-head">
                  <span>Хуваарь</span>
                </div>
                <div className="pl-schedule-list">
                  {schedule.length === 0 ? (
                    <div className="text-center text-muted small py-3">Хуваарь бүртгэгдээгүй.</div>
                  ) : (
                    schedule.map((s, i) => (
                      <div className="pl-schedule-item" key={i}>
                        <div className="pl-schedule-time">{s.time}</div>
                        <div className="pl-schedule-title">{s.title}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="pl-widgets-sidebar">
        <div className="pl-widget">
          <div className="pl-widget-head">
            <span>Түргэн үйлдлүүд</span>
          </div>
          <div className="pl-quick-action-list">
            <Link href="/platform/trips" className="pl-quick-action text-decoration-none text-reset">
              <div className="pl-icon-box">
                <i className="fa-solid fa-plane-up" />
              </div>
              <div>
                <div className="fw-bold smaller">Аяллын удирдлага</div>
                <div className="smaller text-muted">Шинэ аялал, засах, устгах</div>
              </div>
            </Link>
            <Link href="/platform/events" className="pl-quick-action text-decoration-none text-reset">
              <div className="pl-icon-box">
                <i className="fa-regular fa-calendar-plus" />
              </div>
              <div>
                <div className="fw-bold smaller">Эвент үүсгэх</div>
                <div className="smaller text-muted">BNI хурал, сургалт, эвент</div>
              </div>
            </Link>
            <Link href="/platform/profile" className="pl-quick-action text-decoration-none text-reset">
              <div className="pl-icon-box">
                <i className="fa-regular fa-user" />
              </div>
              <div>
                <div className="fw-bold smaller">Бизнес профайл</div>
                <div className="smaller text-muted">Компанийн мэдээлэл шинэчлэх</div>
              </div>
            </Link>
            <Link href="/platform/media" className="pl-quick-action text-decoration-none text-reset">
              <div className="pl-icon-box">
                <i className="fa-regular fa-images" />
              </div>
              <div>
                <div className="fw-bold smaller">Медиа сан</div>
                <div className="smaller text-muted">Hero зураг, слайдер</div>
              </div>
            </Link>
          </div>
        </div>
        <div className="pl-widget">
          <div className="pl-widget-head">
            <span>Шуурхай тойм</span>
          </div>
          <Sparkline values={sparkline} />
          <div className="d-flex justify-content-between mt-2">
            <div>
              <div className="smaller text-muted fw-bold">Шинэ бүртгэл (7хн)</div>
              <div className="fw-bold">{formatInteger(lastWeekRegs)}</div>
            </div>
            <div className="text-end">
              <div className="smaller text-muted fw-bold">Орлого (30хн)</div>
              <div className="fw-bold">{formatMoney(revenueLast30)}</div>
            </div>
          </div>
          <hr className="my-3 opacity-10" />
          <div className="smaller fw-bold text-muted mb-2">Топ арга хэмжээ</div>
          <div className="d-flex flex-column gap-2">
            {topEvents.length === 0 ? (
              <div className="text-muted smaller">Өгөгдөл байхгүй.</div>
            ) : (
              topEvents.map((t, i) => (
                <div key={i} className="d-flex justify-content-between smaller fw-bold">
                  <span>
                    {i + 1}. {t.title}
                  </span>
                  <span>{formatInteger(t.count)}</span>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="pl-widget">
          <div className="pl-widget-head">
            <span>Төлбөр &amp; Тикет</span>
          </div>
          <div className="pl-ticket-box">
            {tickets.length === 0 ? (
              <div className="text-muted smaller py-2">Тикет бүртгэгдээгүй.</div>
            ) : (
              tickets.map((tk, i) => (
                <div key={i}>
                  <div className="pl-ticket-row">
                    <span>{tk.label}</span>
                    <span className={tk.active ? "text-success" : "text-muted"}>
                      <i className={`fa-solid ${tk.active ? "fa-circle-check" : "fa-circle"}`} />{" "}
                      {tk.active ? "Идэвхтэй" : "Идэвхгүй"}
                    </span>
                  </div>
                  <div className="pl-ticket-row">
                    <span className="text-muted">Үнэ: {tk.free ? "Үнэгүй" : formatMoney(tk.priceMnt)}</span>
                    <span className="smaller text-muted">{tk.free ? "Төлбөргүй" : "Төлбөртэй"}</span>
                  </div>
                  {i < tickets.length - 1 ? <hr className="my-2 opacity-10" /> : null}
                </div>
              ))
            )}
          </div>
          <div className="d-flex justify-content-between mt-3 align-items-end">
            <div>
              <div className="smaller text-muted fw-bold">Нийт орлого</div>
              <div className="fw-bold" style={{ fontSize: "1.1rem" }}>
                {formatMoney(metrics.revenueTotalMnt)}
              </div>
            </div>
            <div className="text-end">
              <div className="smaller text-muted fw-bold">Төлбөрийн төрөл</div>
              <div className="d-flex gap-1 justify-content-end mt-1">
                <span className="pl-badge" style={{ background: "#eff6ff", color: "#2563eb" }}>
                  QPay
                </span>
                <span className="pl-badge" style={{ background: "#f5f3ff", color: "#7c3aed" }}>
                  Invoice
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
