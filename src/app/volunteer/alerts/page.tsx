import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { VolunteerAlerts } from "./VolunteerAlerts";

export default async function VolunteerAlertsPage() {
  const session = await getSession();
  if (!session || session.role !== "volunteer") {
    redirect("/volunteer/login");
  }
  return (
    <div className="flex-1 bg-zinc-50 px-4 py-8">
      <VolunteerAlerts />
    </div>
  );
}
