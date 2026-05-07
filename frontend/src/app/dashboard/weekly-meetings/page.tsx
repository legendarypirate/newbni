import Link from "next/link";
import { DashboardPage } from "@/components/dashboard/DashboardPage";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatMnDate } from "@/lib/format-date";
import { serverAuthedFetch } from "@/lib/server-authed-fetch";

export const dynamic = "force-dynamic";

type WeeklyMeetingListRow = {
  id: bigint | number | string;
  publicToken: string;
  meetingDate: string | Date;
  location: string | null;
  group: { name: string };
  _count: { registrations: number };
};

export default async function WeeklyMeetingsListPage() {
  const res = (await serverAuthedFetch("/meetings/weekly")
    .then((r) => r.json())
    .catch(() => ({ ok: false }))) as { ok?: boolean; meetings?: WeeklyMeetingListRow[] };
  const meetings: WeeklyMeetingListRow[] = res.meetings ?? [];

  return (
    <DashboardPage maxWidthClass="max-w-5xl">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-primary">7 хоногийн бизнес хурал</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            QR бүртгэл, төлбөрийн төлөв, roster — нэг дор. Эхлээд хурал үүсгээд оролцогчдын холбоосыг хуваалцаарай.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/weekly-meetings/new">+ Хурал үүсгэх</Link>
        </Button>
      </div>

      <Card className="overflow-hidden py-0 shadow-md">
        {meetings.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground">
            Одоогоор үүсгэсэн хурал алга. &quot;Хурал үүсгэх&quot; дарна уу.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead>Бүлэг / салбар</TableHead>
                <TableHead>Огноо</TableHead>
                <TableHead>Байршил</TableHead>
                <TableHead className="text-end">Бүртгэл</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {meetings.map((m) => (
                <TableRow key={m.id.toString()}>
                  <TableCell>
                    <Link
                      href={`/dashboard/weekly-meetings/${m.id.toString()}`}
                      className="font-semibold text-primary hover:underline"
                    >
                      {m.group.name}
                    </Link>
                    <div className="mt-0.5 break-all text-xs text-muted-foreground">Токен: {m.publicToken}</div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm">{formatMnDate(m.meetingDate)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{m.location ?? "—"}</TableCell>
                  <TableCell className="text-end tabular-nums text-sm">{m._count.registrations}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </DashboardPage>
  );
}
