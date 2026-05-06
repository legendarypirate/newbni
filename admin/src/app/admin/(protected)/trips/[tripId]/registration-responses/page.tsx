type Props = { params: Promise<{ tripId: string }> };

export async function generateMetadata({ params }: Props) {
  const { tripId: raw } = await params;
  return { title: `Аялал #${raw} — хариултууд | Админ` };
}

export default async function AdminTripRegistrationResponsesPage({ params }: Props) {
  const { tripId: raw } = await params;
  return (
    <div>
      <h1 className="h4 fw-bold mb-3">Аялал #{raw} — хариултууд</h1>
      <div className="alert alert-info">API-only migration in progress.</div>
      <a className="btn btn-sm btn-outline-primary" href={`/api/admin/trips/${raw}/registration-responses/export`}>
        CSV татах
      </a>
    </div>
  );
}
