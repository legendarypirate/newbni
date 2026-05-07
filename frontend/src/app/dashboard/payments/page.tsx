import Link from "next/link";
import type { Metadata } from "next";
import { DashboardPage } from "@/components/dashboard/DashboardPage";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatMnDate } from "@/lib/format-date";
import { serverAuthedFetch } from "@/lib/server-authed-fetch";

export const metadata: Metadata = {
  title: "Төлбөр, нэхэмжлэх | Удирдлагын самбар",
};

export const dynamic = "force-dynamic";

type PaymentOrderRow = {
  id: bigint | number | string;
  orderRef: string;
  targetType: string;
  targetId: bigint | number | string;
  amountMnt: number;
  qpayInvoiceId?: string | null;
  status?: string;
  createdAt?: string | Date;
};

export default async function DashboardPaymentsPage() {
  const res = (await serverAuthedFetch("/payments")
    .then((r) => r.json())
    .catch(() => ({ ok: false, data: [] }))) as { ok?: boolean; data?: PaymentOrderRow[] };
  const orders: PaymentOrderRow[] = res.ok && Array.isArray(res.data) ? res.data : [];

  return (
    <DashboardPage>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Төлбөр, нэхэмжлэх</h1>
          <p className="mt-1 text-sm text-muted-foreground">QPay болон бусад төлбөрийн интеграци удахгүй нэмэгдэнэ.</p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard/registrations">Бүртгэлүүд</Link>
        </Button>
      </div>

      <Card className="overflow-hidden py-0 shadow-md">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead>Захиалга</TableHead>
              <TableHead>Зорилго</TableHead>
              <TableHead>Дүн (₮)</TableHead>
              <TableHead>QPay</TableHead>
              <TableHead>Төлөв</TableHead>
              <TableHead className="text-end">Үүсгэсэн</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  Нэхэмжлэх алга.
                </TableCell>
              </TableRow>
            ) : (
              orders.map((o) => (
                <TableRow key={o.id.toString()}>
                  <TableCell className="font-mono text-xs">{o.orderRef}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {o.targetType} · {o.targetId.toString()}
                  </TableCell>
                  <TableCell className="text-sm font-semibold tabular-nums">{o.amountMnt.toLocaleString("mn-MN")}</TableCell>
                  <TableCell className="max-w-[140px] truncate text-xs">{o.qpayInvoiceId ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{o.status}</Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-end text-xs text-muted-foreground">
                    {formatMnDate(o.createdAt)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </DashboardPage>
  );
}
