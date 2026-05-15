"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import SafeImage from "@/components/SafeImage";
import { usePlatformSession } from "@/components/platform/PlatformSessionContext";

type ShopItem = {
  id: string;
  name: string;
  category: string;
  priceMnt: number;
  imageDataUrl: string;
  active: boolean;
  views: number;
  createdAt: string;
};

const emptyForm = {
  name: "",
  category: "",
  price: "",
};

function formatMoney(v: number): string {
  return `${Math.max(0, v).toLocaleString("mn-MN")} ₮`;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export default function ShopPlatformPanel() {
  const session = usePlatformSession();
  const storageKey = `busy-shop-items:${session.id}`;
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [items, setItems] = useState<ShopItem[]>([]);

  useEffect(() => {
    try {
      const parsed = JSON.parse(window.localStorage.getItem(storageKey) || "[]") as ShopItem[];
      setItems(Array.isArray(parsed) ? parsed : []);
    } catch {
      setItems([]);
    }
  }, [storageKey]);
  const [form, setForm] = useState(emptyForm);
  const [imageDataUrl, setImageDataUrl] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(items));
  }, [items, storageKey]);

  const totalItems = items.length;
  const activeItems = items.filter((item) => item.active).length;
  const incomingOrdersCount = 0;
  const totalViews = useMemo(() => items.reduce((sum, item) => sum + item.views, 0), [items]);

  async function handleImage(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMessage("Зөвхөн зураг файл сонгоно уу.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setMessage("Зураг 10MB-аас бага байх ёстой.");
      return;
    }
    setImageDataUrl(await readFileAsDataUrl(file));
    setMessage("Зураг сонгогдлоо.");
  }

  function resetForm() {
    setForm(emptyForm);
    setImageDataUrl("");
    if (fileRef.current) fileRef.current.value = "";
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = form.name.trim();
    const priceMnt = Number(form.price.replace(/[^\d.]/g, ""));
    if (!name || !Number.isFinite(priceMnt) || priceMnt <= 0) {
      setMessage("Бүтээгдэхүүний нэр болон үнийг зөв оруулна уу.");
      return;
    }

    const item: ShopItem = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name,
      category: form.category.trim() || "Ерөнхий",
      priceMnt: Math.round(priceMnt),
      imageDataUrl,
      active: true,
      views: Math.floor(Math.random() * 40) + 1,
      createdAt: new Date().toISOString(),
    };
    setItems((prev) => [item, ...prev]);
    resetForm();
    setMessage("Бүтээгдэхүүн хадгалагдлаа.");
  }

  return (
    <>
      <div className="ps-hero mb-4">
        <div className="ps-hero-icon">
          <i className="fa-solid fa-store" />
        </div>
        <div>
          <h2 className="h4 fw-bold mb-1">Дэлгүүрийн удирдлага</h2>
          <p className="mb-0 small opacity-75">Бүтээгдэхүүнээ удирдаж, борлуулалтаа өсгө.</p>
        </div>
      </div>

      <div className="ps-stats-grid">
        <div className="ps-stat-card">
          <div className="ps-stat-icon blue">
            <i className="fa-solid fa-box" />
          </div>
          <div className="ps-stat-info">
            <span className="ps-stat-label">Нийт бүтээгдэхүүн</span>
            <span className="ps-stat-value">{totalItems.toLocaleString("mn-MN")}</span>
            <span className="ps-stat-meta">Local draft store</span>
          </div>
        </div>
        <div className="ps-stat-card">
          <div className="ps-stat-icon green">
            <i className="fa-solid fa-circle-check" />
          </div>
          <div className="ps-stat-info">
            <span className="ps-stat-label">Идэвхтэй бүтээгдэхүүн</span>
            <span className="ps-stat-value">{activeItems.toLocaleString("mn-MN")}</span>
            <span className="ps-stat-meta">Нийтээс идэвхтэй</span>
          </div>
        </div>
        <div className="ps-stat-card">
          <div className="ps-stat-icon purple">
            <i className="fa-solid fa-cart-shopping" />
          </div>
          <div className="ps-stat-info">
            <span className="ps-stat-label">Ирсэн захиалга</span>
            <span className="ps-stat-value">{incomingOrdersCount.toLocaleString("mn-MN")}</span>
            <span className="ps-stat-meta">
              <Link href="/platform/shop_orders_in" className="text-decoration-none opacity-75">
                Жагсаалт үзэх
              </Link>
            </span>
          </div>
        </div>
        <div className="ps-stat-card">
          <div className="ps-stat-icon orange">
            <i className="fa-solid fa-eye" />
          </div>
          <div className="ps-stat-info">
            <span className="ps-stat-label">Нийт үзэлт</span>
            <span className="ps-stat-value">{totalViews.toLocaleString("mn-MN")}</span>
            <span className="ps-stat-meta">+ 22% энэ сарын</span>
          </div>
        </div>
      </div>

      <form className="pm-card mb-4" onSubmit={handleSubmit}>
        <div className="pm-card-header">
          <i className="fa-solid fa-plus-circle" />
          <div>
            <div className="pm-card-title">Бүтээгдэхүүн нэмэх</div>
            <div className="pm-card-subtitle">Шинэ бүтээгдэхүүний мэдээлэл оруулна уу.</div>
          </div>
        </div>
        <div className="pm-card-body">
          {message ? (
            <div className="alert alert-info py-2 small mb-3" role="status">
              {message}
            </div>
          ) : null}
          <div className="row g-4">
            <div className="col-lg-7">
              <div className="pm-form-grid">
                <div className="pm-form-group">
                  <label className="pm-label">
                    Бүтээгдэхүүний нэр <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="pm-input"
                    placeholder="Нэр оруулна уу"
                    value={form.name}
                    onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                  />
                </div>
                <div className="pm-form-group">
                  <label className="pm-label">
                    Үнэ (₮) <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    className="pm-input"
                    placeholder="0"
                    value={form.price}
                    onChange={(event) => setForm((prev) => ({ ...prev, price: event.target.value }))}
                  />
                </div>
                <div className="pm-form-group" style={{ gridColumn: "1 / -1" }}>
                  <label className="pm-label">Ангилал</label>
                  <input
                    type="text"
                    className="pm-input"
                    placeholder="Жишээ: Сав баглаа боодол"
                    value={form.category}
                    onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
                  />
                </div>
              </div>
            </div>
            <div className="col-lg-5">
              <label className="pm-label mb-2">Бүтээгдэхүүний зураг</label>
              <button
                type="button"
                className="pm-upload-box mb-3 w-100"
                style={{ borderStyle: "dashed", padding: 30, background: "transparent" }}
                onClick={() => fileRef.current?.click()}
              >
                {imageDataUrl ? (
                  <SafeImage
                    src={imageDataUrl}
                    alt=""
                    className="ps-product-thumb"
                    style={{ width: 96, height: 96 }}
                    fallback={<i className="fa-solid fa-image text-primary fs-2 mb-2" />}
                  />
                ) : (
                  <i className="fa-solid fa-cloud-arrow-up text-primary fs-2 mb-2" />
                )}
                <div className="small fw-bold">{imageDataUrl ? "Зураг солих" : "Зураг оруулах эсвэл сонгох"}</div>
                <div className="pm-upload-info">JPG, PNG, WEBP - Макс. 10MB</div>
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="d-none"
                onChange={(event) => void handleImage(event.target.files?.[0])}
              />
              <div className="ps-toggle-wrapper small text-muted">
                <i className="fa-solid fa-circle-info text-primary" />
                Нэмсэн бүтээгдэхүүн энэ browser дээр draft байдлаар хадгалагдана.
              </div>
            </div>
            <div className="col-12 text-end">
              <button type="button" className="pm-btn-secondary d-inline-flex px-4 me-2" onClick={resetForm}>
                Цэвэрлэх
              </button>
              <button type="submit" className="pm-btn-primary d-inline-flex px-4">
                Бүтээгдэхүүн хадгалах
              </button>
            </div>
          </div>
        </div>
      </form>

      <div className="ps-table-card">
        <div className="pm-card-header justify-content-between">
          <div className="pm-card-title">Миний бүтээгдэхүүнүүд</div>
        </div>
        <div className="table-responsive">
          <table className="table ps-table align-middle mb-0">
            <thead>
              <tr>
                <th>Зураг</th>
                <th>Бүтээгдэхүүний нэр</th>
                <th>Ангилал</th>
                <th>Үнэ (₮)</th>
                <th>Статус</th>
                <th className="text-end">Үйлдэл</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-5 text-muted">
                    Одоогоор бараа байхгүй. Дээрх form-оор анхны бүтээгдэхүүнээ нэмнэ үү.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      {item.imageDataUrl ? (
                        <SafeImage
                          src={item.imageDataUrl}
                          alt={item.name}
                          className="ps-product-thumb"
                          fallback={<i className="fa-solid fa-box text-muted" />}
                        />
                      ) : (
                        <div className="ps-product-thumb d-grid place-items-center text-muted">
                          <i className="fa-solid fa-box" />
                        </div>
                      )}
                    </td>
                    <td className="fw-semibold text-dark">{item.name}</td>
                    <td>{item.category}</td>
                    <td>{formatMoney(item.priceMnt)}</td>
                    <td>
                      <button
                        type="button"
                        className={`ps-badge border-0 ${item.active ? "active" : "inactive"}`}
                        onClick={() =>
                          setItems((prev) =>
                            prev.map((row) => (row.id === item.id ? { ...row, active: !row.active } : row)),
                          )
                        }
                        title="Статус солих"
                      >
                        {item.active ? "Идэвхтэй" : "Идэвхгүй"}
                      </button>
                    </td>
                    <td>
                      <div className="d-flex justify-content-end gap-2">
                        <button
                          type="button"
                          className="ps-action-icon star active"
                          onClick={() => setMessage(`${item.name} онцлох бараагаар тэмдэглэгдлээ.`)}
                          title="Онцлох"
                        >
                          <i className="fa-solid fa-star" />
                        </button>
                        <button
                          type="button"
                          className="ps-action-icon delete"
                          onClick={() => setItems((prev) => prev.filter((row) => row.id !== item.id))}
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
      </div>
    </>
  );
}
