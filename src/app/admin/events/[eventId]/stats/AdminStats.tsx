"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Stats = {
  tagsIssued: number;
  scans: number;
  activeLostCases: number;
  avgTimeToReuniteMinutes: number | null;
  casesByMeetPoint: { meetPoint: string; count: number }[];
};

export function AdminStats({ eventId }: { eventId: string }) {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch(`/api/admin/events/${eventId}/stats`)
      .then((res) => res.json())
      .then(setStats);
  }, [eventId]);

  if (!stats) return <p className="text-center text-zinc-500">Loading...</p>;

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-zinc-900">Event stats</h1>
        <Link href="/admin/events" className="text-sm text-zinc-500 underline">
          Back
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Tags issued" value={stats.tagsIssued} />
        <StatCard label="Scans" value={stats.scans} />
        <StatCard label="Active LOST cases" value={stats.activeLostCases} />
        <StatCard
          label="Avg. time to reunite"
          value={stats.avgTimeToReuniteMinutes !== null ? `${stats.avgTimeToReuniteMinutes} min` : "—"}
        />
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-zinc-700">Scans by meet point</h2>
        {stats.casesByMeetPoint.length === 0 ? (
          <p className="text-sm text-zinc-500">No notifications routed to a meet point yet.</p>
        ) : (
          <ul className="space-y-1">
            {stats.casesByMeetPoint.map((row) => (
              <li
                key={row.meetPoint}
                className="flex justify-between rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm"
              >
                <span>{row.meetPoint}</span>
                <span className="font-semibold">{row.count}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4">
      <p className="text-2xl font-bold text-zinc-900">{value}</p>
      <p className="text-xs text-zinc-500">{label}</p>
    </div>
  );
}
