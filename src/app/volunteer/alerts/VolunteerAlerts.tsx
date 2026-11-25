"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type AlertPerson = {
  id: string;
  firstName: string;
  ageGroup: string;
  photoUrl: string | null;
  shortCode: string | null;
};

export function VolunteerAlerts() {
  const [people, setPeople] = useState<AlertPerson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/volunteer/alerts")
      .then((res) => res.json())
      .then((data) => {
        setPeople(data.people ?? []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="mx-auto max-w-md space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-zinc-900">LOST alerts</h1>
        <Link href="/volunteer/scan" className="text-sm text-zinc-500 underline">
          Back to scan
        </Link>
      </div>

      {loading && <p className="text-zinc-500">Loading...</p>}
      {!loading && people.length === 0 && (
        <p className="rounded-lg border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500">
          No active LOST reports right now.
        </p>
      )}

      <ul className="space-y-2">
        {people.map((p) => (
          <li key={p.id} className="rounded-lg border border-red-200 bg-red-50 p-3">
            <p className="font-semibold text-red-800">
              {p.firstName} <span className="text-xs font-normal">({p.ageGroup.toLowerCase()})</span>
            </p>
            {p.shortCode && <p className="text-sm text-red-700">Code: {p.shortCode}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}
