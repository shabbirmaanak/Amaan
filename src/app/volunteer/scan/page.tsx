import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { VolunteerScan } from "./VolunteerScan";

export default async function VolunteerScanPage() {
  const session = await getSession();
  if (!session || session.role !== "volunteer") {
    redirect("/volunteer/login");
  }
  return (
    <div className="flex-1 bg-zinc-50 px-4 py-8">
      <VolunteerScan />
    </div>
  );
}
