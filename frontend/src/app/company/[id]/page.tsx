import { permanentRedirect } from "next/navigation";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

/** Legacy URL: keep working while canonical member profile lives at `/member/:id`. */
export default async function CompanyPublicPage({ params }: Props) {
  const { id } = await params;
  permanentRedirect(`/member/${encodeURIComponent(id)}`);
}
