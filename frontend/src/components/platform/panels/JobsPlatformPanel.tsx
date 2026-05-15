"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { usePlatformSession } from "@/components/platform/PlatformSessionContext";

type JobPost = {
  id: string;
  title: string;
  location: string;
  jobType: string;
  workMode: string;
  description: string;
  status: "active" | "draft" | "suspended";
  applications: number;
  createdAt: string;
};

const emptyForm = {
  title: "",
  location: "",
  jobType: "office",
  workMode: "fulltime",
  description: "",
};

function jobTypeLabel(v: string): string {
  if (v === "remote") return "Зайнаас";
  if (v === "hybrid") return "Холимог";
  return "Оффис";
}

function workModeLabel(v: string): string {
  if (v === "parttime") return "Хагас цаг";
  if (v === "contract") return "Гэрээт";
  return "Бүтэн цаг";
}

function statusLabel(v: JobPost["status"]): string {
  if (v === "draft") return "Draft";
  if (v === "suspended") return "Түр зогссон";
  return "Идэвхтэй";
}

export default function JobsPlatformPanel() {
  const session = usePlatformSession();
  const formRef = useRef<HTMLFormElement | null>(null);
  const storageKey = `busy-job-posts:${session.id}`;
  const [jobs, setJobs] = useState<JobPost[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const parsed = JSON.parse(window.localStorage.getItem(storageKey) || "[]") as JobPost[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(storageKey, JSON.stringify(jobs));
    }
  }, [jobs, storageKey]);

  const activeCount = jobs.filter((job) => job.status === "active").length;
  const applicationsCount = jobs.reduce((sum, job) => sum + job.applications, 0);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  function focusForm() {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    formRef.current?.querySelector<HTMLInputElement>('[name="job_title"]')?.focus();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = form.title.trim();
    const location = form.location.trim();
    const description = form.description.trim();
    if (!title || !location || !description) {
      setMessage("Ажлын нэр, байршил, тайлбарыг бөглөнө үү.");
      return;
    }

    if (editingId) {
      setJobs((prev) =>
        prev.map((job) =>
          job.id === editingId
            ? { ...job, title, location, description, jobType: form.jobType, workMode: form.workMode }
            : job,
        ),
      );
      setMessage("Ажлын зар шинэчлэгдлээ.");
      resetForm();
      return;
    }

    const next: JobPost = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      title,
      location,
      description,
      jobType: form.jobType,
      workMode: form.workMode,
      status: "active",
      applications: Math.floor(Math.random() * 6),
      createdAt: new Date().toISOString(),
    };
    setJobs((prev) => [next, ...prev]);
    setMessage("Ажлын зар хадгалагдлаа.");
    resetForm();
  }

  function editJob(job: JobPost) {
    setEditingId(job.id);
    setForm({
      title: job.title,
      location: job.location,
      jobType: job.jobType,
      workMode: job.workMode,
      description: job.description,
    });
    focusForm();
  }

  function cycleStatus(job: JobPost) {
    const nextStatus: JobPost["status"] =
      job.status === "active" ? "suspended" : job.status === "suspended" ? "draft" : "active";
    setJobs((prev) => prev.map((row) => (row.id === job.id ? { ...row, status: nextStatus } : row)));
  }

  return (
    <>
      <div className="tps-greeting">Ажлын зар</div>
      <div className="text-muted small mb-4">Ажлын байр нийтлэх, удирдах, үр дүнг хянах.</div>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <button type="button" className="jbs-btn-primary" onClick={focusForm}>
          <i className="fa-solid fa-plus" /> Ажлын зар нийтлэх
        </button>
      </div>

      <div className="jbs-grid">
        <div className="jbs-main">
          <form className="jbs-card" ref={formRef} onSubmit={handleSubmit}>
            <div className="jbs-card-title">
              {editingId ? "Ажлын зар засах" : "Шинэ ажлын зар үүсгэх"}
              {message ? <span className="small text-primary fw-semibold">{message}</span> : null}
            </div>

            <div className="jbs-form-row two-col">
              <div className="jbs-form-group">
                <label className="jbs-label">
                  Ажлын байрны нэр <abbr>*</abbr>
                </label>
                <input
                  type="text"
                  name="job_title"
                  className="jbs-input"
                  placeholder="Жишээ: Маркетинг менежер"
                  value={form.title}
                  onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                />
              </div>
              <div className="jbs-form-group">
                <label className="jbs-label">
                  Байршил <abbr>*</abbr>
                </label>
                <div className="jbs-input-group">
                  <i className="fa-solid fa-location-dot jbs-input-icon" />
                  <input
                    type="text"
                    className="jbs-input has-icon"
                    placeholder="Байршлыг оруулна уу"
                    value={form.location}
                    onChange={(event) => setForm((prev) => ({ ...prev, location: event.target.value }))}
                  />
                </div>
              </div>
            </div>

            <div className="jbs-form-row two-col">
              <div className="jbs-form-group">
                <label className="jbs-label">Ажлын байрны төрөл</label>
                <select
                  name="job_type"
                  className="jbs-select"
                  value={form.jobType}
                  onChange={(event) => setForm((prev) => ({ ...prev, jobType: event.target.value }))}
                >
                  <option value="office">Оффис</option>
                  <option value="remote">Зайнаас</option>
                  <option value="hybrid">Холимог</option>
                </select>
              </div>
              <div className="jbs-form-group">
                <label className="jbs-label">Ажиллах хэлбэр</label>
                <select
                  name="job_work_mode"
                  className="jbs-select"
                  value={form.workMode}
                  onChange={(event) => setForm((prev) => ({ ...prev, workMode: event.target.value }))}
                >
                  <option value="fulltime">Бүтэн цаг</option>
                  <option value="parttime">Хагас цаг</option>
                  <option value="contract">Гэрээт</option>
                </select>
              </div>
            </div>

            <div className="jbs-form-group mb-4">
              <label className="jbs-label">
                Ажлын байрны товч тайлбар <abbr>*</abbr>
              </label>
              <textarea
                name="job_description"
                className="jbs-input"
                rows={4}
                placeholder="Тайлбар..."
                value={form.description}
                onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              />
            </div>

            <div className="text-end">
              <button type="button" className="btn btn-light me-2" onClick={resetForm}>
                Цэвэрлэх
              </button>
              <button type="submit" className="jbs-btn-primary">
                {editingId ? "Шинэчлэх" : "Хадгалах"}
              </button>
            </div>
          </form>
        </div>
        <div className="jbs-sidebar">
          <div className="jbs-stat-grid mb-3">
            <div className="jbs-stat-card">
              <div className="jbs-stat-icon blue">
                <i className="fa-solid fa-briefcase" />
              </div>
              <div className="jbs-stat-info">
                <span className="jbs-stat-lbl">Идэвхтэй зар</span>
                <span className="jbs-stat-val">{activeCount.toLocaleString("mn-MN")}</span>
              </div>
            </div>
            <div className="jbs-stat-card">
              <div className="jbs-stat-icon green">
                <i className="fa-solid fa-user-check" />
              </div>
              <div className="jbs-stat-info">
                <span className="jbs-stat-lbl">Аплай</span>
                <span className="jbs-stat-val">{applicationsCount.toLocaleString("mn-MN")}</span>
              </div>
            </div>
          </div>
          <div className="jbs-tip-card">
            <div className="jbs-tip-icon">
              <i className="fa-solid fa-circle-info" />
            </div>
            <div className="jbs-tip-content">
              Зарыг бүрэн бөглөж, цалин болон давуу талаа тодорхой бичвэл илүү олон өргөдөл ирнэ.
            </div>
          </div>
        </div>
      </div>

      <div className="jbs-table-card mt-4">
        <div className="jbs-table-header">
          <span className="fw-bold small">Нийтлэгдсэн зарууд</span>
        </div>
        <table className="table jbs-table mb-0">
          <thead>
            <tr>
              <th>Ажлын байр</th>
              <th>Байршил</th>
              <th>Төлөв</th>
              <th className="text-end">Үйлдэл</th>
            </tr>
          </thead>
          <tbody>
            {jobs.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-5 text-muted">
                  Жагсаалт хоосон. Дээрх form-оор анхны ажлын зараа нийтэлнэ үү.
                </td>
              </tr>
            ) : (
              jobs.map((job) => (
                <tr key={job.id}>
                  <td>
                    <button type="button" className="jbs-job-title bg-transparent border-0 p-0" onClick={() => editJob(job)}>
                      {job.title}
                    </button>
                    <div className="jbs-job-sub">
                      <span className={`jbs-job-dot ${job.status === "active" ? "" : "inactive"}`} />
                      {jobTypeLabel(job.jobType)} · {workModeLabel(job.workMode)} · {job.applications} аплай
                    </div>
                  </td>
                  <td>{job.location}</td>
                  <td>
                    <button
                      type="button"
                      className={`jbs-badge border-0 ${job.status === "active" ? "active" : job.status === "suspended" ? "suspended" : "draft"}`}
                      onClick={() => cycleStatus(job)}
                      title="Төлөв солих"
                    >
                      {statusLabel(job.status)}
                    </button>
                  </td>
                  <td>
                    <div className="d-flex justify-content-end gap-2">
                      <button type="button" className="jbs-action-btn" onClick={() => editJob(job)} title="Засах">
                        <i className="fa-solid fa-pencil" />
                      </button>
                      <button
                        type="button"
                        className="jbs-action-btn danger"
                        onClick={() => setJobs((prev) => prev.filter((row) => row.id !== job.id))}
                        title="Устгах"
                      >
                        <i className="fa-solid fa-trash" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
