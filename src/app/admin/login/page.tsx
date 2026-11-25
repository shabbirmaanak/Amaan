import { OtpForm } from "@/components/OtpForm";

export default function AdminLoginPage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-6 py-16">
      <OtpForm purpose="ADMIN_LOGIN" redirectTo="/admin/events" title="Admin login" />
    </div>
  );
}
