import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { AdminVolunteers } from "./AdminVolunteers";

export default async function AdminVolunteersPage() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    redirect("/admin/login");
  }
  return (
    <div className="flex-1 bg-zinc-50 px-4 py-8">
      <AdminVolunteers />
    </div>
  );
}
