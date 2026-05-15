"use client";

import { useCallback, useEffect, useMemo, useState, startTransition } from "react";
import { eventApprovalBadgeProps } from "@/components/platform/ApprovalStatusBadge";
import TripFormQrCard from "@/components/trip-registration/TripFormQrCard";
import { apiFetch } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type EventMeta = {
  id: string;
  title: string;
  approvalStatus?: string;
};

type FormMeta = {
  id: string;
  publicSlug: string;
  isPublished: boolean;
  title: string;
};

async function readJson<T>(res: Response): Promise<T> {
  return (await res.json().catch(() => ({}))) as T;
}

export default function EventEditorRegistrationQrAside({ eventId }: { eventId: string }) {
  const [ev, setEv] = useState<EventMeta | null>(null);
  const [form, setForm] = useState<FormMeta | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(eventId !== "0");

  const load = useCallback(async () => {
    if (eventId === "0" || eventId === "") {
      setEv(null);
      setForm(null);
      setLoadError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const res = await apiFetch(`/events/${encodeURIComponent(eventId)}/registration-form-meta`, {
        cache: "no-store",
      });
      const data = await readJson<{ event?: EventMeta; form?: FormMeta | null; error?: string }>(res);
      if (!res.ok) {
        throw new Error(data.error === "forbidden" ? "Эрх хүрэлцэхгүй байна." : "Ачаалахад алдаа.");
      }
      if (data.event) setEv(data.event);
      setForm(data.form ?? null);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Алдаа");
      setEv(null);
      setForm(null);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    startTransition(() => {
      void load();
    });
  }, [load]);

  const publicUrl = useMemo(() => {
    if (!form?.publicSlug || typeof window === "undefined") return "";
    return `${window.location.origin}/register/${encodeURIComponent(form.publicSlug)}`;
  }, [form?.publicSlug]);

  const approval = eventApprovalBadgeProps(ev?.approvalStatus, form?.isPublished);

  if (eventId === "0" || eventId === "") {
    return (
      <Card className="border-dashed shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Нийтийн бүртгэл + QR</CardTitle>
          <CardDescription className="text-xs leading-relaxed">
            Шинэ эвентийг эхлээд хадгалаад дараа нь энд QR, нийтийн холбоос гарна.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="shadow-sm">
        <CardContent className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
          <span
            className="inline-block size-5 animate-spin rounded-full border-2 border-primary border-t-transparent"
            aria-hidden
          />
          Ачаалж байна…
        </CardContent>
      </Card>
    );
  }

  if (loadError) {
    return (
      <Card className="border-destructive/40 bg-destructive/5 shadow-sm">
        <CardContent className="py-4 text-sm text-destructive">{loadError}</CardContent>
        <CardContent className="pt-0">
          <Button type="button" variant="outline" size="sm" onClick={() => void load()}>
            Дахин оролдох
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {ev ? (
        <Card className="border-l-4 border-l-primary py-3 shadow-sm">
          <CardHeader className="space-y-1 px-4 pb-2 pt-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Эвент</CardTitle>
            <p className="text-sm font-semibold leading-snug text-foreground">{ev.title}</p>
            <CardDescription className="text-[11px] leading-relaxed d-flex flex-wrap align-items-center gap-2">
              <span>ID {ev.id}</span>
              <span className={`badge ${approval.className}`}>{approval.text}</span>
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {!form ? (
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Нийтийн форм</CardTitle>
            <CardDescription className="text-xs leading-relaxed">
              Бүртгэлийн асуулга бөглөөд эвентийг хадгална уу.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Button type="button" variant="outline" size="sm" onClick={() => void load()}>
              Шалгах
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Админы зөвшөөрөл</CardTitle>
              <CardDescription className="text-xs leading-relaxed">
                Админ зөвшөөрсний дараа <span className="font-mono text-[10px]">/events</span> дээр харагдана.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 pt-0">
              {form.isPublished && publicUrl ? (
                <Button asChild variant="outline" size="sm" className="w-fit">
                  <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                    Урьдчилж харах
                  </a>
                </Button>
              ) : (
                <p className="text-xs text-muted-foreground mb-0">Нийтийн бүртгэл одоогоор хаалттай.</p>
              )}
              <Button type="button" variant="ghost" size="sm" className="w-fit" onClick={() => void load()}>
                Сэргээх
              </Button>
            </CardContent>
          </Card>

          <TripFormQrCard
            formId={form.id}
            publicSlug={form.publicSlug}
            publicUrl={publicUrl}
            isPublished={form.isPublished}
            compact
          />
        </>
      )}
    </div>
  );
}
