import { redirect } from "next/navigation";
import { defaultAdminLandingPath, isAdminPanelRole, type PlatformRole } from "@/lib/admin-session";
import { getPlatformSession } from "@/lib/platform-session";

export default async function AdminRootRedirect() {
  const u = await getPlatformSession();
  if (u && isAdminPanelRole(u.role)) {
    redirect(defaultAdminLandingPath(u.role as PlatformRole, "/admin/dashboard"));
  }
  redirect("/admin/login?next=/admin/dashboard");
}
