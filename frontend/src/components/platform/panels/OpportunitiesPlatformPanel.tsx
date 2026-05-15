"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { usePlatformSession } from "@/components/platform/PlatformSessionContext";

type OpportunityStatus = "open" | "closed";
type OpportunityType = "investment" | "partnership" | "supplier";
type Opportunity = {
  id: string;
  title: string;
  type: OpportunityType;
  budget: string;
  location: string;
  description: string;
  status: OpportunityStatus;
  applications: number;
  views: number;
  createdAt: string;
};
type IncomingRequest = {
  id: string;
  name: string;
  company: string;
  message: string;
  opportunityTitle: string;
  status: "pending" | "accepted" | "declined";
};

const emptyForm = {
  title: "",
  type: "partnership" as OpportunityType,
  budget: "",
  location: "",
  description: "",
};

const sampleRequests: IncomingRequest[] = [
  {
    id: "sample-1",
    name: "M. Энхбат",
    company: "Asia Trade Partners",
    opportunityTitle: "Хамтын ажиллагааны санал",
    message: "Таны нийтэлсэн боломж дээр хамтран ажиллах сонирхолтой байна. Дэлгэрэнгүй ярилцах боломжтой юу?",
    status: "pending",
  },
  {
    id: "sample-2",
    name: "S. Номин",
    company: "Green Supply LLC",
    opportunityTitle: "Нийлүүлэгч хайж байна",
    message: "Манай бүтээгдэхүүний каталоги болон үнийн санал илгээх боломжтой.",
    status: "pending",
  },
];

function typeLabel(type: OpportunityType): string {
  if (type === "investment") return "Хөрөнгө оруулалт";
  if (type === "supplier") return "Нийлүүлэгч";
  return "Түншлэл";
}

function iconColor(type: OpportunityType): "blue" | "orange" | "green" {
  if (type === "investment") return "orange";
  if (type === "supplier") return "green";
  return "blue";
}

function iconClass(type: OpportunityType): string {
  if (type === "investment") return "fa-solid fa-chart-line";
  if (type === "supplier") return "fa-solid fa-industry";
  return "fa-regular fa-handshake";
}

export default function OpportunitiesPlatformPanel() {
  const session = usePlatformSession();
  const formRef = useRef<HTMLFormElement | null>(null);
  const opportunitiesKey = `busy-opportunities:${session.id}`;
  const requestsKey = `busy-opportunity-requests:${session.id}`;
  const [filter, setFilter] = useState<"all" | OpportunityStatus>("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [opportunities, setOpportunities] = useState<Opportunity[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const parsed = JSON.parse(window.localStorage.getItem(opportunitiesKey) || "[]") as Opportunity[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [requests, setRequests] = useState<IncomingRequest[]>(() => {
    if (typeof window === "undefined") return sampleRequests;
    try {
      const raw = window.localStorage.getItem(requestsKey);
      if (!raw) return sampleRequests;
      const parsed = JSON.parse(raw) as IncomingRequest[];
      return Array.isArray(parsed) ? parsed : sampleRequests;
    } catch {
      return sampleRequests;
    }
  });

  useEffect(() => {
    window.localStorage.setItem(opportunitiesKey, JSON.stringify(opportunities));
  }, [opportunities, opportunitiesKey]);

  useEffect(() => {
    window.localStorage.setItem(requestsKey, JSON.stringify(requests));
  }, [requests, requestsKey]);

  const filteredOpportunities = useMemo(
    () => opportunities.filter((opp) => filter === "all" || opp.status === filter),
    [filter, opportunities],
  );
  const statPostedOpp = opportunities.length;
  const statSentApps = opportunities.reduce((sum, opp) => sum + opp.applications, 0);
  const statIncomingApps = requests.length;
  const pendingHint = requests.filter((req) => req.status === "pending").length;

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  function focusForm() {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    formRef.current?.querySelector<HTMLInputElement>('[name="opportunity_title"]')?.focus();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = form.title.trim();
    const description = form.description.trim();
    if (!title || !description) {
      setMessage("Гарчиг болон тайлбарыг бөглөнө үү.");
      return;
    }

    if (editingId) {
      setOpportunities((prev) =>
        prev.map((opp) =>
          opp.id === editingId
            ? {
                ...opp,
                title,
                type: form.type,
                budget: form.budget.trim(),
                location: form.location.trim(),
                description,
              }
            : opp,
        ),
      );
      setMessage("Боломж шинэчлэгдлээ.");
      resetForm();
      return;
    }

    const next: Opportunity = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      title,
      type: form.type,
      budget: form.budget.trim(),
      location: form.location.trim() || "Монгол",
      description,
      status: "open",
      applications: Math.floor(Math.random() * 5),
      views: Math.floor(Math.random() * 120) + 12,
      createdAt: new Date().toISOString(),
    };
    setOpportunities((prev) => [next, ...prev]);
    setMessage("Шинэ боломж нийтлэгдлээ.");
    resetForm();
  }

  function editOpportunity(opp: Opportunity) {
    setEditingId(opp.id);
    setForm({
      title: opp.title,
      type: opp.type,
      budget: opp.budget,
      location: opp.location,
      description: opp.description,
    });
    focusForm();
  }

  return (
    <>
      <div className="tps-greeting">Хөрөнгө оруулалт & боломжууд</div>
      <div className="text-muted small mb-4">Таны бизнес боломжууд болон холбогдох хүсэлтүүд.</div>

      <div className="ops-stat-grid">
        <button type="button" className="ops-stat-card text-start" onClick={() => setFilter("all")}>
          <div className="ops-stat-icon blue">
            <i className="fa-regular fa-file-lines" />
          </div>
          <div>
            <span className="ops-stat-label">Миний нийтэлсэн</span>
            <div className="ops-stat-value">{statPostedOpp}</div>
            <div className="ops-stat-meta">
              Нийт нийтэлсэн <i className="fa-solid fa-chevron-right ms-1 small" />
            </div>
          </div>
        </button>
        <button type="button" className="ops-stat-card text-start" onClick={() => setFilter("open")}>
          <div className="ops-stat-icon orange">
            <i className="fa-regular fa-paper-plane" />
          </div>
          <div>
            <span className="ops-stat-label">Илгээсэн өргөдөл</span>
            <div className="ops-stat-value">{statSentApps}</div>
            <div className="ops-stat-meta">
              Нийт илгээсэн <i className="fa-solid fa-chevron-right ms-1 small" />
            </div>
          </div>
        </button>
        <button type="button" className="ops-stat-card text-start" onClick={() => setMessage(`${pendingHint} шинэ хүсэлт байна.`)}>
          <div className="ops-stat-icon green">
            <i className="fa-regular fa-comments" />
          </div>
          <div>
            <span className="ops-stat-label">Ирсэн хүсэлт</span>
            <div className="ops-stat-value">{statIncomingApps}</div>
            <div className="ops-stat-meta">
              Шинэ <b className="text-success">{pendingHint}</b> <i className="fa-solid fa-chevron-right ms-1 small" />
            </div>
          </div>
        </button>
      </div>

      <div className="ops-grid mt-4">
        <div>
          <form className="ops-content-card mb-4" ref={formRef} onSubmit={handleSubmit}>
            <div className="d-flex align-items-start justify-content-between gap-3 mb-3">
              <div>
                <div className="fw-bold">{editingId ? "Боломж засах" : "Шинэ боломж үүсгэх"}</div>
                <div className="small text-muted">Хөрөнгө оруулалт, түншлэл, нийлүүлэгчийн боломжоо нийтэлнэ.</div>
              </div>
              {message ? <span className="small text-primary fw-semibold">{message}</span> : null}
            </div>
            <div className="row g-3">
              <div className="col-md-8">
                <label className="nws-label">Гарчиг *</label>
                <input
                  name="opportunity_title"
                  className="nws-input"
                  value={form.title}
                  onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                  placeholder="Жишээ: Сав баглаа боодлын нийлүүлэгч хайж байна"
                />
              </div>
              <div className="col-md-4">
                <label className="nws-label">Төрөл</label>
                <select
                  className="nws-input"
                  value={form.type}
                  onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value as OpportunityType }))}
                >
                  <option value="partnership">Түншлэл</option>
                  <option value="investment">Хөрөнгө оруулалт</option>
                  <option value="supplier">Нийлүүлэгч</option>
                </select>
              </div>
              <div className="col-md-6">
                <label className="nws-label">Төсөв / Дүн</label>
                <input
                  className="nws-input"
                  value={form.budget}
                  onChange={(event) => setForm((prev) => ({ ...prev, budget: event.target.value }))}
                  placeholder="Жишээ: 50,000,000 ₮"
                />
              </div>
              <div className="col-md-6">
                <label className="nws-label">Байршил</label>
                <input
                  className="nws-input"
                  value={form.location}
                  onChange={(event) => setForm((prev) => ({ ...prev, location: event.target.value }))}
                  placeholder="Монгол, БНХАУ, Солонгос..."
                />
              </div>
              <div className="col-12">
                <label className="nws-label">Тайлбар *</label>
                <textarea
                  className="nws-input"
                  rows={4}
                  value={form.description}
                  onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                  placeholder="Боломжийн зорилго, шаардлага, хамтрагчаас хүлээж буй зүйлээ бичнэ үү..."
                />
              </div>
              <div className="col-12 text-end">
                <button type="button" className="btn btn-light me-2" onClick={resetForm}>
                  Цэвэрлэх
                </button>
                <button type="submit" className="ops-new-btn d-inline-flex w-auto px-4 mb-0">
                  <i className="fa-solid fa-paper-plane" /> {editingId ? "Шинэчлэх" : "Нийтлэх"}
                </button>
              </div>
            </div>
          </form>

          <div className="ops-content-card">
            <div className="ops-filter-tabs">
              <button type="button" className={`ops-tab ${filter === "all" ? "active" : ""}`} onClick={() => setFilter("all")}>
                Бүгд
              </button>
              <button type="button" className={`ops-tab ${filter === "open" ? "active" : ""}`} onClick={() => setFilter("open")}>
                Нээлттэй
              </button>
              <button type="button" className={`ops-tab ${filter === "closed" ? "active" : ""}`} onClick={() => setFilter("closed")}>
                Хаагдсан
              </button>
            </div>

            {filteredOpportunities.length === 0 ? (
              <div className="text-center py-5">
                <div className="ops-stat-icon blue mx-auto mb-3" style={{ width: 80, height: 80, fontSize: "2rem" }}>
                  <i className="fa-regular fa-lightbulb" />
                </div>
                <h3 className="h6 fw-bold">Одоогоор боломж нийтлээгүй байна</h3>
                <p className="text-muted small mb-0">Шинэ боломж нийтэлж хамтын ажиллагаагаа эхлүүлээрэй.</p>
              </div>
            ) : (
              filteredOpportunities.map((opp) => (
                <div className="ops-item" key={opp.id}>
                  <div className={`ops-item-icon ${iconColor(opp.type)}`}>
                    <i className={iconClass(opp.type)} />
                  </div>
                  <div>
                    <button type="button" className="ops-item-title bg-transparent border-0 p-0 text-start" onClick={() => editOpportunity(opp)}>
                      {opp.title}
                    </button>
                    <div className="ops-item-meta">
                      <span><i className="fa-solid fa-tag" /> {typeLabel(opp.type)}</span>
                      <span><i className="fa-solid fa-location-dot" /> {opp.location || "Монгол"}</span>
                      {opp.budget ? <span><i className="fa-solid fa-wallet" /> {opp.budget}</span> : null}
                    </div>
                    <div className="small text-muted mt-2">{opp.description}</div>
                    <div className="ops-item-actions">
                      <button type="button" className="ops-action-link bg-transparent border-0 p-0" onClick={() => editOpportunity(opp)}>
                        <i className="fa-regular fa-pen-to-square" /> Засах
                      </button>
                      <button
                        type="button"
                        className="ops-action-link bg-transparent border-0 p-0"
                        onClick={() =>
                          setOpportunities((prev) =>
                            prev.map((row) => (row.id === opp.id ? { ...row, status: row.status === "open" ? "closed" : "open" } : row)),
                          )
                        }
                      >
                        <i className="fa-solid fa-repeat" /> Төлөв солих
                      </button>
                      <button
                        type="button"
                        className="ops-action-link danger bg-transparent border-0 p-0"
                        onClick={() => setOpportunities((prev) => prev.filter((row) => row.id !== opp.id))}
                      >
                        <i className="fa-regular fa-trash-can" /> Устгах
                      </button>
                    </div>
                  </div>
                  <div>
                    <span className={`ops-badge ${opp.status}`}>{opp.status === "open" ? "OPEN" : "CLOSED"}</span>
                    <div className="ops-stat-pill mt-3 p-0">
                      <div className="ops-pill">
                        <span className="ops-pill-val">{opp.applications}</span>
                        <span className="ops-pill-lbl">apps</span>
                      </div>
                      <div className="ops-pill">
                        <span className="ops-pill-val">{opp.views}</span>
                        <span className="ops-pill-lbl">views</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        <div style={{ width: 340, maxWidth: "100%" }}>
          <div className="ops-sidebar-card">
            <button type="button" className="ops-new-btn" onClick={focusForm}>
              <i className="fa-solid fa-plus" /> Шинэ боломж үүсгэх
            </button>
            <div className="fw-bold small mb-2">Ирсэн хүсэлтүүд</div>
            {requests.length === 0 ? (
              <div className="small text-muted">Ирсэн хүсэлт байхгүй.</div>
            ) : (
              requests.map((req) => (
                <div className="ops-incoming-card" key={req.id}>
                  <div className="ops-incoming-head">
                    <div className="ops-incoming-avatar d-grid place-items-center fw-bold text-primary">
                      {req.name.slice(0, 1)}
                    </div>
                    <div className="ops-incoming-info">
                      <span className="ops-incoming-name">{req.name}</span>
                      <span className="ops-incoming-meta">{req.company} · {req.status}</span>
                    </div>
                  </div>
                  <div className="ops-incoming-msg">{req.message}</div>
                  <div className="ops-incoming-btns">
                    <button
                      type="button"
                      className="ops-btn-sm primary"
                      onClick={() => setRequests((prev) => prev.map((row) => (row.id === req.id ? { ...row, status: "accepted" } : row)))}
                    >
                      Зөвшөөрөх
                    </button>
                    <button
                      type="button"
                      className="ops-btn-sm"
                      onClick={() => setRequests((prev) => prev.map((row) => (row.id === req.id ? { ...row, status: "declined" } : row)))}
                    >
                      Татгалзах
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}
