type Props = { params: Promise<{ eventId: string }> };

export async function generateMetadata({ params }: Props) {
  const { eventId: raw } = await params;
  return { title: `Эвент #${raw} — хариултууд | Админ` };
}

export default async function AdminEventRegistrationResponsesPage({ params }: Props) {
  const { eventId: raw } = await params;
  return (
    <div>
      <h1 className="h4 fw-bold mb-3">Эвент #{raw} — хариултууд</h1>
      <div className="alert alert-info">API-only migration in progress.</div>
      <a className="btn btn-sm btn-outline-primary" href={`/api/admin/events/${raw}/registration-responses/export`}>
        CSV татах
      </a>
    </div>
  );
}
