"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LogoutButton } from "@/components/LogoutButton";

type EventRow = {
  id: string;
  name: string;
  startAt: string;
  endAt: string;
  status: string;
  helpDeskNumber: string;
  meetPoints: { id: string; name: string }[];
  _count: { people: number; tags: number; volunteers: number };
};

export function AdminEvents() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  async function refresh() {
    const res = await fetch("/api/admin/events");
    const data = await res.json();
    setEvents(data.events ?? []);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function endEvent(id: string) {
    if (!confirm("End this event now? All its tags will expire immediately.")) return;
    await fetch(`/api/admin/events/${id}/end`, { method: "POST" });
    refresh();
  }

  async function addMeetPoint(eventId: string) {
    const name = prompt("Meet point name (e.g. Gate 2, Help Desk A)");
    if (!name) return;
    await fetch(`/api/admin/events/${eventId}/meetpoints`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    refresh();
  }

  if (loading) return <p className="text-center text-zinc-500">Loading...</p>;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-zinc-900">Events</h1>
        <div className="flex items-center gap-3">
          <Link href="/admin/volunteers" className="text-sm font-medium text-zinc-700 underline">
            Volunteers
          </Link>
          <button
            onClick={() => setShowForm((s) => !s)}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
          >
            {showForm ? "Close" : "+ New event"}
          </button>
          <LogoutButton redirectTo="/admin/login" />
        </div>
      </div>

      {showForm && (
        <CreateEventForm
          onDone={() => {
            setShowForm(false);
            refresh();
          }}
        />
      )}

      <ul className="space-y-3">
        {events.map((ev) => (
          <li key={ev.id} className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-zinc-900">{ev.name}</p>
                <p className="text-xs text-zinc-500">
                  {new Date(ev.startAt).toLocaleString()} — {new Date(ev.endAt).toLocaleString()}
                </p>
                <p className="text-xs text-zinc-500">Help desk: {ev.helpDeskNumber}</p>
              </div>
              <span
                className={`rounded-full px-2 py-1 text-xs font-bold ${
                  ev.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-500"
                }`}
              >
                {ev.status}
              </span>
            </div>

            <p className="mt-2 text-sm text-zinc-600">
              {ev._count.people} people · {ev._count.tags} tags · {ev._count.volunteers} volunteers
            </p>

            <div className="mt-2 flex flex-wrap gap-1">
              {ev.meetPoints.map((mp) => (
                <span key={mp.id} className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">
                  {mp.name}
                </span>
              ))}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={() => addMeetPoint(ev.id)}
                className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700"
              >
                + Meet point
              </button>
              <Link
                href={`/admin/events/${ev.id}/stats`}
                className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700"
              >
                Stats
              </Link>
              {ev.status === "ACTIVE" && (
                <button
                  onClick={() => endEvent(ev.id)}
                  className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white"
                >
                  End event
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CreateEventForm({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [helpDeskNumber, setHelpDeskNumber] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const res = await fetch("/api/admin/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        startAt: new Date(startAt).toISOString(),
        endAt: new Date(endAt).toISOString(),
        helpDeskNumber,
      }),
    });
    setSubmitting(false);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Could not create event");
      return;
    }
    onDone();
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-lg border border-zinc-200 bg-white p-4">
      <input
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Event name"
        className="w-full rounded-lg border border-zinc-300 px-3 py-2"
      />
      <div className="grid grid-cols-2 gap-2">
        <input
          required
          type="datetime-local"
          value={startAt}
          onChange={(e) => setStartAt(e.target.value)}
          className="rounded-lg border border-zinc-300 px-3 py-2"
        />
        <input
          required
          type="datetime-local"
          value={endAt}
          onChange={(e) => setEndAt(e.target.value)}
          className="rounded-lg border border-zinc-300 px-3 py-2"
        />
      </div>
      <input
        required
        value={helpDeskNumber}
        onChange={(e) => setHelpDeskNumber(e.target.value)}
        placeholder="Help desk number, e.g. +919876500000"
        className="w-full rounded-lg border border-zinc-300 px-3 py-2"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button disabled={submitting} className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 font-medium text-white">
        {submitting ? "Creating..." : "Create event"}
      </button>
    </form>
  );
}
