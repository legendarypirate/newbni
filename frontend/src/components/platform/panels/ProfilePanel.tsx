"use client";

import { useCallback, useEffect, useState } from "react";
import CompanyProfileForm from "@/components/platform/profile/CompanyProfileForm";
import { MONGOLIA_BANKS_CATALOG } from "@/lib/mongolia-banks";
import { computeProfileCompletionPct } from "@/lib/platform-profile-completion";
import { apiFetch } from "@/lib/api-client";
import { usePlatformSession } from "@/components/platform/PlatformSessionContext";

function asRecord(json: unknown): Record<string, unknown> {
  if (json && typeof json === "object" && !Array.isArray(json)) {
    return json as Record<string, unknown>;
  }
  return {};
}

type ProfileRow = {
  displayName: string;
  companyName: string | null;
  businessPhone: string | null;
  businessEmail: string | null;
  website: string | null;
  addressLine: string | null;
  bio: string | null;
  businessJson: unknown;
  photoUrl: string | null;
};

function readProfile(raw: Record<string, unknown> | null): ProfileRow | null {
  if (!raw) return null;
  return {
    displayName: String(raw.displayName ?? ""),
    companyName: raw.companyName == null ? null : String(raw.companyName),
    businessPhone: raw.businessPhone == null ? null : String(raw.businessPhone),
    businessEmail: raw.businessEmail == null ? null : String(raw.businessEmail),
    website: raw.website == null ? null : String(raw.website),
    addressLine: raw.addressLine == null ? null : String(raw.addressLine),
    bio: raw.bio == null ? null : String(raw.bio),
    businessJson: raw.businessJson,
    photoUrl: raw.photoUrl == null ? null : String(raw.photoUrl),
  };
}

export default function ProfilePanel() {
  const session = usePlatformSession();
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [formKey, setFormKey] = useState(0);

  const loadProfile = useCallback(async () => {
    const res = await apiFetch(`/profiles/${encodeURIComponent(session.id)}`);
    if (!res.ok) {
      setProfile(null);
      return;
    }
    const json = (await res.json().catch(() => null)) as
      | { ok?: boolean; data?: Record<string, unknown> }
      | null;
    setProfile(readProfile(json?.data ?? null));
  }, [session.id]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        await loadProfile();
      } catch {
        if (!cancelled) setProfile(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadProfile]);

  const handleProfileSaved = useCallback(async () => {
    setLoading(true);
    try {
      await loadProfile();
      setFormKey((k) => k + 1);
    } catch {
      /* keep current form values */
    } finally {
      setLoading(false);
    }
  }, [loadProfile]);

  if (loading) {
    return (
      <div className="text-muted small py-5 text-center" aria-busy="true">
        Уншиж байна…
      </div>
    );
  }

  const biz = asRecord(profile?.businessJson);

  let savedBankCode = String(biz.bank_code ?? "").trim();
  if (!savedBankCode && biz.bank_name) {
    const legacyName = String(biz.bank_name).trim();
    const hit = MONGOLIA_BANKS_CATALOG.find((b) => b.nameMn === legacyName);
    if (hit) {
      savedBankCode = hit.code;
    }
  }

  const pct = computeProfileCompletionPct(profile, biz);

  return (
    <CompanyProfileForm
      key={formKey}
      onSaved={handleProfileSaved}
      accountIdStr={session.id}
      email={session.email}
      completionPct={pct}
      savedBankCode={savedBankCode}
      businessJson={biz}
      profile={{
        displayName: profile?.displayName?.trim() || session.displayName,
        companyName: profile?.companyName?.trim() ?? "",
        businessPhone: profile?.businessPhone?.trim() ?? "",
        businessEmail: profile?.businessEmail?.trim() ?? "",
        website: profile?.website?.trim() ?? "",
        addressLine: profile?.addressLine?.trim() ?? "",
        bio: profile?.bio?.trim() ?? "",
        photoUrl: profile?.photoUrl?.trim() ?? "",
      }}
    />
  );
}
