"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type VolunteerRow = {
  id: string;
  name: string;
  phone: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  event: { name: string };
};

export function AdminVolunteers() {
  const [volunteers, setVolunteers] = useState<VolunteerRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    const res = await fetch("/api/admin/volunteers");
    const data = await res.json();
    setVolunteers(data.volunteers ?? []);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function setStatus(id: string, status: "APPROVED" | "REJECTED") {
    await fetch(`/api/admin/volunteers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    refresh();
  }

  if (loading) return <p className="text-center text-zinc-500">Loading...</p>;

  return (
    <div className="mx-auto max-w-md space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-zinc-900">Volunteers</h1>
        <Link href="/admin/events" className="text-sm text-zinc-500 underline">
          Back
        </Link>
      </div>

      <ul className="space-y-2">
        {volunteers.map((v) => (
          <li key={v.id} className="rounded-lg border border-zinc-200 bg-white p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-zinc-900">{v.name}</p>
                <p className="text-xs text-zinc-500">
                  {v.phone} · {v.event.name}
                </p>
              </div>
              <span className="rounded-full bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-600">
                {v.status}
              </span>
            </div>
            {v.status === "PENDING" && (
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => setStatus(v.id, "APPROVED")}
                  className="flex-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white"
                >
                  Approve
                </button>
                <button
                  onClick={() => setStatus(v.id, "REJECTED")}
                  className="flex-1 rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white"
                >
                  Reject
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
