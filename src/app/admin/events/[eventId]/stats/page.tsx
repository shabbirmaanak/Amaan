import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { AdminStats } from "./AdminStats";

export default async function AdminStatsPage({ params }: { params: Promise<{ eventId: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    redirect("/admin/login");
  }
  const { eventId } = await params;
  return (
    <div className="flex-1 bg-zinc-50 px-4 py-8">
      <AdminStats eventId={eventId} />
    </div>
  );
}
