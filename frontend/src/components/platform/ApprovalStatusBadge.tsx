type Props = {
  statusLabel?: string | null;
  formPublished?: boolean;
  className?: string;
};

export function tripApprovalBadgeProps(statusLabel?: string | null, formPublished?: boolean) {
  const label = String(statusLabel || "").trim();
  if (label === "Нийтлэгдсэн" || formPublished) {
    return { className: "bg-success", text: "Зөвшөөрсөн" };
  }
  if (label === "Татгалзсан") {
    return { className: "bg-danger", text: "Татгалзсан" };
  }
  if (label === "Хүлээгдэж байна") {
    return { className: "bg-warning text-dark", text: "Хүлээгдэж байна" };
  }
  return { className: "bg-secondary", text: "Ноорог" };
}

export function eventApprovalBadgeProps(approvalStatus?: string | null, formPublished?: boolean) {
  const s = String(approvalStatus || "").trim().toLowerCase();
  if (s === "published" || formPublished) {
    return { className: "bg-success", text: "Зөвшөөрсөн" };
  }
  if (s === "rejected") {
    return { className: "bg-danger", text: "Татгалзсан" };
  }
  if (s === "pending") {
    return { className: "bg-warning text-dark", text: "Хүлээгдэж байна" };
  }
  return { className: "bg-secondary", text: "Ноорог" };
}

export default function ApprovalStatusBadge({ statusLabel, formPublished, className = "" }: Props) {
  const { className: tone, text } = tripApprovalBadgeProps(statusLabel, formPublished);
  return <span className={`badge ${tone} ${className}`.trim()}>{text}</span>;
}
