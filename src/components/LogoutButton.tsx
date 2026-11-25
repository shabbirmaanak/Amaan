"use client";

import { useRouter } from "next/navigation";

export function LogoutButton({ redirectTo = "/" }: { redirectTo?: string }) {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push(redirectTo);
      }}
      className="text-sm text-zinc-500 underline"
    >
      Log out
    </button>
  );
}
