import Link from "next/link";
import { OtpForm } from "@/components/OtpForm";

export default function VolunteerLoginPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-zinc-50 px-6 py-16">
      <OtpForm purpose="VOLUNTEER_LOGIN" redirectTo="/volunteer/scan" title="Volunteer desk login" />
      <p className="text-sm text-zinc-500">
        Not registered yet?{" "}
        <Link href="/volunteer/apply" className="underline">
          Apply to volunteer
        </Link>
      </p>
    </div>
  );
}
