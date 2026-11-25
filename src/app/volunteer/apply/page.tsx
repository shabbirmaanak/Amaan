"use client";

import { useEffect, useState } from "react";

type EventOption = { id: string; name: string };

export default function VolunteerApplyPage() {
  const [events, setEvents] = useState<EventOption[]>([]);
  const [eventId, setEventId] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    fetch("/api/events")
      .then((res) => res.json())
      .then((data) => {
        setEvents(data.events ?? []);
        if (data.events?.[0]) setEventId(data.events[0].id);
      });
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/volunteer/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId, name, phone }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Could not submit application");
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div className="flex flex-1 items-center justify-center bg-zinc-50 px-6 py-16">
        <p className="max-w-sm text-center text-zinc-700">
          Thanks! An admin will approve your account, then you can log in with your phone number.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-6 py-16">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4">
        <h1 className="text-xl font-bold text-zinc-900">Apply to volunteer</h1>
        <select
          value={eventId}
          onChange={(e) => setEventId(e.target.value)}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2"
        >
          {events.map((ev) => (
            <option key={ev.id} value={ev.id}>
              {ev.name}
            </option>
          ))}
        </select>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="w-full rounded-lg border border-zinc-300 px-3 py-2"
        />
        <input
          required
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+919876543210"
          className="w-full rounded-lg border border-zinc-300 px-3 py-2"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="w-full rounded-lg bg-zinc-900 px-4 py-3 font-medium text-white">
          Submit application
        </button>
      </form>
    </div>
  );
}
