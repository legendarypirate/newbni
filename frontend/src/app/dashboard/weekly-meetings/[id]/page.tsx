import Link from "next/link";
import { notFound } from "next/navigation";
import { DashboardBreadcrumb } from "@/components/dashboard/DashboardBreadcrumb";
import { DashboardPage } from "@/components/dashboard/DashboardPage";
import { serverAuthedFetch } from "@/lib/server-authed-fetch";
import { publicApiUrl } from "@/lib/backend-api";
import { formatClockUtc, formatMnDate } from "@/lib/format-date";
import type { BusyMeetingAttendanceStatus, BusyMeetingPaymentStatus } from "@/lib/platform-db-types";
import StaffRegistrationTable from "@/components/weekly-meeting/StaffRegistrationTable";

export const dynamic = "force-dynamic";

type RegistrationRow = {
  id: bigint | number | string;
  participantType: string;
  displayName: string;
  companyName: string | null;
  position: string | null;
  businessCategory: string | null;
  phone: string | null;
  email: string | null;
  invitedBy: string | null;
  shortIntroduction: string | null;
  paymentStatus: BusyMeetingPaymentStatus;
  attendanceStatus: BusyMeetingAttendanceStatus;
};

type MeetingDetail = {
  id: bigint | number | string;
  publicToken: string;
  feeMnt: unknown;
  meetingDate: string | Date;
  startTime: string | Date;
  endTime: string | Date | null;
  location: string | null;
  enableShortIntroduction: boolean;
  group: { name: string };
  registrations: RegistrationRow[];
};

type Props = { params: Promise<{ id: string }> };

export default async function WeeklyMeetingDetailPage({ params }: Props) {
  const { id } = await params;

  const res = (await serverAuthedFetch(`/meetings/weekly/${id}`)
    .then((r) => r.json())
    .catch(() => ({ ok: false }))) as { ok?: boolean; meeting?: MeetingDetail };
  const meeting = res.ok ? res.meeting : null;

  if (!meeting) notFound();

  const feeLabel =
    meeting.feeMnt !== null && meeting.feeMnt !== undefined
      ? `${Number(meeting.feeMnt).toLocaleString("mn-MN")} ₮`
      : "—";

  const rows = meeting.registrations.map((r: RegistrationRow) => ({
    id: r.id.toString(),
    participantType: r.participantType,
    displayName: r.displayName,
    companyName: r.companyName,
    position: r.position,
    businessCategory: r.businessCategory,
    phone: r.phone,
    email: r.email,
    invitedBy: r.invitedBy,
    shortIntroduction: r.shortIntroduction,
    paymentStatus: r.paymentStatus,
    attendanceStatus: r.attendanceStatus,
  }));

  const regUrl = `/m/${meeting.publicToken}`;
  const qrSrc = publicApiUrl(`/api/meetings/weekly/${meeting.id.toString()}/qr`);
  const csvHref = publicApiUrl(`/api/meetings/weekly/${meeting.id.toString()}/roster`);

  return (
    <DashboardPage>
      <DashboardBreadcrumb
        className="mb-3"
        items={[
          { label: "7 хоногийн хурал", href: "/dashboard/weekly-meetings" },
          { label: meeting.group.name },
        ]}
      />

      <div className="row g-4">
        <div className="col-lg-7">
          <div className="card border-0 shadow-sm rounded-4">
            <div className="card-body">
              <h1 className="h4 fw-bold mb-2">{meeting.group.name}</h1>
              <p className="text-muted mb-3">
                {formatMnDate(new Date(meeting.meetingDate))} · {formatClockUtc(new Date(meeting.startTime))}
                {meeting.endTime ? ` — ${formatClockUtc(new Date(meeting.endTime))}` : ""}
              </p>
              <p className="mb-2">
                <span className="text-muted">Байршил:</span> {meeting.location ?? "—"}
              </p>
              <p className="mb-0">
                <span className="text-muted">Төлбөр:</span> {feeLabel}
              </p>
            </div>
          </div>

          <div className="card border-0 shadow-sm rounded-4 mt-4">
            <div className="card-body">
              <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
                <h2 className="h6 fw-bold mb-0">Бүртгэлүүд ({meeting.registrations.length})</h2>
                <div className="d-flex flex-wrap gap-2">
                  <a className="btn btn-sm btn-outline-primary" href={csvHref}>
                    Excel (CSV) татах
                  </a>
                  <Link className="btn btn-sm btn-outline-secondary" href={`/dashboard/weekly-meetings/${meeting.id.toString()}/print`}>
                    Хэвлэх харагдац
                  </Link>
                </div>
              </div>
              {rows.length === 0 ? (
                <p className="text-muted mb-0">Одоогоор бүртгэл алга.</p>
              ) : (
                <StaffRegistrationTable
                  meetingId={meeting.id.toString()}
                  rows={rows}
                  showIntro={meeting.enableShortIntroduction}
                />
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-5">
          <div className="card border-0 shadow-sm rounded-4">
            <div className="card-body text-center">
              <h2 className="h6 fw-bold mb-3">QR — нээлттэй бүртгэл</h2>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrSrc} alt="QR код" className="img-fluid rounded-3 border mb-3" style={{ maxWidth: 280 }} />
              <p className="small text-muted text-break mb-2">Холбоос: {regUrl}</p>
              <Link href={regUrl} className="btn btn-sm btn-primary rounded-pill" target="_blank" rel="noreferrer">
                Бүртгэлийн хуудсыг нээх
              </Link>
            </div>
          </div>
        </div>
      </div>
    </DashboardPage>
  );
}
