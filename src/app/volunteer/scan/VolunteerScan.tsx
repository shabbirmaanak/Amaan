"use client";

import { useState } from "react";
import Link from "next/link";
import { LogoutButton } from "@/components/LogoutButton";

type VolunteerTagData = {
  viewer: "volunteer";
  tagId: string;
  tagStatus: string;
  highPriority: boolean;
  person: {
    firstName: string;
    photoUrl: string | null;
    ageGroup: string;
    languages: string[];
    medicalNotes: string | null;
    status: string;
  };
  guardian: { name: string; phone: string };
  backupContacts: { name: string; phone: string }[];
  case: { id: string; status: "FOUND" | "FAMILY_NOTIFIED" | "REUNITED" } | null;
};

const STATUS_FLOW: Array<"FOUND" | "FAMILY_NOTIFIED" | "REUNITED"> = [
  "FOUND",
  "FAMILY_NOTIFIED",
  "REUNITED",
];

export function VolunteerScan() {
  const [code, setCode] = useState("");
  const [data, setData] = useState<VolunteerTagData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function lookup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setData(null);
    setLoading(true);
    const res = await fetch(`/api/public/tag/${code.trim()}`);
    setLoading(false);
    const body = await res.json();
    if (!res.ok) {
      setError(body.error ?? "Could not find this tag");
      return;
    }
    setData(body);
  }

  async function setStatus(status: "FOUND" | "FAMILY_NOTIFIED" | "REUNITED") {
    const res = await fetch(`/api/volunteer/tag/${code.trim()}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) lookup({ preventDefault: () => {} } as React.FormEvent);
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-zinc-900">Volunteer desk</h1>
        <div className="flex items-center gap-3">
          <Link href="/volunteer/alerts" className="text-sm font-medium text-red-600">
            LOST alerts
          </Link>
          <LogoutButton redirectTo="/volunteer/login" />
        </div>
      </div>

      <form onSubmit={lookup} className="flex gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Enter short code"
          className="flex-1 rounded-lg border border-zinc-300 px-3 py-2"
        />
        <button disabled={loading} className="rounded-lg bg-zinc-900 px-4 py-2 font-medium text-white">
          {loading ? "..." : "Look up"}
        </button>
      </form>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {data && (
        <div className="space-y-4 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
          {data.highPriority && (
            <div className="rounded-lg bg-red-100 px-3 py-2 text-sm font-bold text-red-700">
              HIGH PRIORITY — reported LOST by guardian
            </div>
          )}

          <div>
            <p className="text-lg font-semibold text-zinc-900">{data.person.firstName}</p>
            <p className="text-sm text-zinc-500">{data.person.ageGroup.toLowerCase()}</p>
            {data.person.languages.length > 0 && (
              <p className="text-sm text-zinc-500">Speaks: {data.person.languages.join(", ")}</p>
            )}
          </div>

          {data.person.medicalNotes && (
            <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
              <p className="font-semibold">Medical notes</p>
              <p>{data.person.medicalNotes}</p>
            </div>
          )}

          <div className="space-y-2">
            <p className="text-sm font-semibold text-zinc-700">Contacts</p>
            <a href={`tel:${data.guardian.phone}`} className="block rounded-lg border border-zinc-300 px-3 py-2 text-sm">
              Guardian: {data.guardian.name} — {data.guardian.phone}
            </a>
            {data.backupContacts.map((c, i) => (
              <a key={i} href={`tel:${c.phone}`} className="block rounded-lg border border-zinc-300 px-3 py-2 text-sm">
                Backup: {c.name} — {c.phone}
              </a>
            ))}
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-zinc-700">Case status</p>
            <div className="flex gap-2">
              {STATUS_FLOW.map((s) => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={`flex-1 rounded-lg px-2 py-2 text-xs font-medium ${
                    data.case?.status === s
                      ? "bg-zinc-900 text-white"
                      : "border border-zinc-300 text-zinc-700"
                  }`}
                >
                  {s.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
