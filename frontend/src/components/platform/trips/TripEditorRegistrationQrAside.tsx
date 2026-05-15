"use client";

import { useCallback, useEffect, useMemo, useState, startTransition } from "react";
import ApprovalStatusBadge from "@/components/platform/ApprovalStatusBadge";
import TripFormQrCard from "@/components/trip-registration/TripFormQrCard";
import { apiFetch } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type TripMeta = {
  id: number;
  destination: string;
  startDate: string;
  endDate: string;
  statusLabel: string | null;
};

type FormMeta = {
  id: string;
  publicSlug: string;
  isPublished: boolean;
  title: string;
};

async function readJson<T>(res: Response): Promise<T> {
  const j = (await res.json().catch(() => ({}))) as T;
  return j;
}

export default function TripEditorRegistrationQrAside({ tripId }: { tripId: number }) {
  const [trip, setTrip] = useState<TripMeta | null>(null);
  const [form, setForm] = useState<FormMeta | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(tripId > 0);

  const load = useCallback(async () => {
    if (tripId < 1) {
      setTrip(null);
      setForm(null);
      setLoadError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const res = await apiFetch(`/platform/trips/${tripId}/registration-form-meta`, { cache: "no-store" });
      const data = await readJson<{ trip?: TripMeta; form?: FormMeta | null; error?: string }>(res);
      if (!res.ok) {
        throw new Error(data.error === "forbidden" ? "Эрх хүрэлцэхгүй байна." : "Ачаалахад алдаа.");
      }
      if (data.trip) setTrip(data.trip);
      setForm(data.form ?? null);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Алдаа");
      setTrip(null);
      setForm(null);
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    startTransition(() => {
      void load();
    });
  }, [load]);

  const publicUrl = useMemo(() => {
    if (!form?.publicSlug || typeof window === "undefined") return "";
    return `${window.location.origin}/register/${encodeURIComponent(form.publicSlug)}`;
  }, [form?.publicSlug]);

  if (tripId < 1) {
    return (
      <Card className="border-dashed shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Нийтийн бүртгэл + QR</CardTitle>
          <CardDescription className="text-xs leading-relaxed">
            Шинэ аяллыг эхлээд хадгалаад дараа нь энд QR, нийтийн холбоос гарна.
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
      {trip ? (
        <Card className="border-l-4 border-l-primary py-3 shadow-sm">
          <CardHeader className="space-y-1 px-4 pb-2 pt-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Аялал</CardTitle>
            <p className="text-sm font-semibold leading-snug text-foreground">{trip.destination}</p>
            <CardDescription className="text-[11px] leading-relaxed d-flex flex-wrap align-items-center gap-2">
              <span>ID {trip.id}</span>
              <ApprovalStatusBadge statusLabel={trip.statusLabel} formPublished={form?.isPublished} />
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {!form ? (
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Нийтийн форм</CardTitle>
            <CardDescription className="text-xs leading-relaxed">
              Асуулгууд серверт үүсээгүй байна. Дээрх асуулгыг бөглөөд аяллыг &quot;Хадгалах&quot; дарна уу.
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
                Админ зөвшөөрсний дараа аялал нийт вэб дээр харагдана. QR:{" "}
                <span className="font-mono text-[10px]">/register/{form.publicSlug}</span>
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
                <p className="text-xs text-muted-foreground mb-0">
                  Одоогоор нийтийн бүртгэл хаалттай. Админ зөвшөөрсний дараа идэвхжинэ.
                </p>
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
