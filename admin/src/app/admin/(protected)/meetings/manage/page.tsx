import EventsPanel from "@/components/platform/panels/EventsPanel";

export const metadata = { title: "Эвент засвар | Админ" };
export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminMeetingsManagePage({ searchParams }: Props) {
  const sp = await searchParams;
  return <EventsPanel searchParams={sp} venue="admin" />;
}
