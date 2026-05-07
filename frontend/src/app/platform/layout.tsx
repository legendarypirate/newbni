import "@/styles/platform-home-panels.css";
import PlatformBodyClass from "@/components/platform/PlatformBodyClass";
import PlatformSidebar from "@/components/platform/PlatformSidebar";
import PlatformAuthGate from "@/components/platform/PlatformAuthGate";

/**
 * Auth is enforced *client-side* by `PlatformAuthGate` (JWT from
 * `localStorage` → `/auth/me`). The server layout itself does no session
 * lookup, so it works regardless of whether cookies survive the round-trip
 * to the API host.
 */
export const dynamic = "force-dynamic";

export default function PlatformLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <PlatformBodyClass />
      <div className="pl-wrapper">
        <PlatformSidebar />
        <main className="pl-content">
          <PlatformAuthGate>{children}</PlatformAuthGate>
        </main>
      </div>
    </>
  );
}
