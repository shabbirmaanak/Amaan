import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { GuardianDashboard } from "./GuardianDashboard";

export default async function GuardianDashboardPage() {
  const session = await getSession();
  if (!session || session.role !== "guardian") {
    redirect("/guardian");
  }
  return (
    <div className="flex-1 bg-zinc-50 px-4 py-8">
      <GuardianDashboard />
    </div>
  );
}
