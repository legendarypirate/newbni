import { redirect } from "next/navigation";
import CompanyProfileForm from "@/components/platform/profile/CompanyProfileForm";
import { MONGOLIA_BANKS_CATALOG } from "@/lib/mongolia-banks";
import { computeProfileCompletionPct } from "@/lib/platform-profile-completion";
import { fetchPlatformProfileByAccountId } from "@/lib/fetch-platform-profile";
import { getPlatformSession } from "@/lib/platform-session";

function asRecord(json: unknown): Record<string, unknown> {
  if (json && typeof json === "object" && !Array.isArray(json)) {
    return json as Record<string, unknown>;
  }
  return {};
}

export default async function ProfilePanel() {
  const session = await getPlatformSession();
  if (!session) {
    redirect("/auth/login?next=/platform/profile");
  }
  const profileRow = await fetchPlatformProfileByAccountId(session.id);
  const profile = profileRow
    ? {
        displayName: String(profileRow.displayName ?? ""),
        companyName: profileRow.companyName == null ? null : String(profileRow.companyName),
        businessPhone: profileRow.businessPhone == null ? null : String(profileRow.businessPhone),
        businessEmail: profileRow.businessEmail == null ? null : String(profileRow.businessEmail),
        website: profileRow.website == null ? null : String(profileRow.website),
        addressLine: profileRow.addressLine == null ? null : String(profileRow.addressLine),
        bio: profileRow.bio == null ? null : String(profileRow.bio),
        businessJson: profileRow.businessJson,
        photoUrl: profileRow.photoUrl == null ? null : String(profileRow.photoUrl),
      }
    : null;

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
      accountIdStr={session.id.toString()}
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
