"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Purpose = "GUARDIAN_LOGIN" | "VOLUNTEER_LOGIN" | "ADMIN_LOGIN";

export function OtpForm({
  purpose,
  redirectTo,
  askName,
  title,
}: {
  purpose: Purpose;
  redirectTo: string;
  askName?: boolean;
  title: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function requestOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/auth/otp/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, purpose }),
    });
    setLoading(false);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Something went wrong");
      return;
    }
    setStep("code");
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/auth/otp/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, code, purpose, name: askName ? name : undefined }),
    });
    setLoading(false);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Incorrect code");
      return;
    }
    router.push(redirectTo);
  }

  return (
    <div className="w-full max-w-sm space-y-6">
      <h1 className="text-xl font-bold text-zinc-900">{title}</h1>

      {step === "phone" && (
        <form onSubmit={requestOtp} className="space-y-4">
          {askName && (
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">Your name</label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2"
                placeholder="Umm Zainab"
              />
            </div>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">Phone number</label>
            <input
              required
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2"
              placeholder="+919876543210"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            disabled={loading}
            className="w-full rounded-lg bg-zinc-900 px-4 py-3 font-medium text-white disabled:opacity-50"
          >
            {loading ? "Sending..." : "Send code"}
          </button>
        </form>
      )}

      {step === "code" && (
        <form onSubmit={verifyOtp} className="space-y-4">
          <p className="text-sm text-zinc-600">Enter the 6-digit code sent to {phone}.</p>
          <input
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
            maxLength={6}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-center text-lg tracking-widest"
            placeholder="123456"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            disabled={loading}
            className="w-full rounded-lg bg-zinc-900 px-4 py-3 font-medium text-white disabled:opacity-50"
          >
            {loading ? "Verifying..." : "Verify & continue"}
          </button>
          <button
            type="button"
            onClick={() => setStep("phone")}
            className="w-full text-sm text-zinc-500 underline"
          >
            Change phone number
          </button>
        </form>
      )}
    </div>
  );
}
