import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-6 py-16">
      <main className="w-full max-w-sm space-y-6 text-center">
        <h1 className="text-2xl font-bold text-zinc-900">Ashara Safety Tag</h1>
        <p className="text-sm text-zinc-600">
          Help reunite lost children and elders with their families at the gathering.
        </p>
        <div className="flex flex-col gap-3">
          <Link
            href="/guardian"
            className="rounded-lg bg-zinc-900 px-4 py-3 font-medium text-white"
          >
            I&apos;m a Guardian
          </Link>
          <Link
            href="/volunteer/login"
            className="rounded-lg border border-zinc-300 px-4 py-3 font-medium text-zinc-900"
          >
            I&apos;m a Volunteer (Khidmat desk)
          </Link>
          <Link
            href="/admin/login"
            className="rounded-lg border border-zinc-300 px-4 py-3 font-medium text-zinc-900"
          >
            Admin
          </Link>
        </div>
        <p className="pt-4 text-xs text-zinc-400">
          Found a lost tag? Scan the QR code on the wristband or card instead of using this page.
        </p>
      </main>
    </div>
  );
}
