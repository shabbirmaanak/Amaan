import { OtpForm } from "@/components/OtpForm";

export default function GuardianLoginPage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-6 py-16">
      <OtpForm
        purpose="GUARDIAN_LOGIN"
        redirectTo="/guardian/dashboard"
        askName
        title="Guardian sign in / sign up"
      />
    </div>
  );
}
