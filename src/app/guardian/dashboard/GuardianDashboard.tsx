"use client";

import { useEffect, useState } from "react";

type EventOption = { id: string; name: string; endAt: string };

type BackupContact = { name: string; phone: string; order: number };

type Tag = { id: string; shortCode: string; status: string };

type Person = {
  id: string;
  firstName: string;
  ageGroup: string;
  status: string;
  languages: string[];
  medicalNotes: string | null;
  backupContacts: BackupContact[];
  tags: Tag[];
  event: { id: string; name: string; status: string };
};

export function GuardianDashboard() {
  const [events, setEvents] = useState<EventOption[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  async function refresh() {
    try {
      const [eventsRes, peopleRes] = await Promise.all([
        fetch("/api/events"),
        fetch("/api/guardian/people"),
      ]);
      const eventsData = await eventsRes.json();
      const peopleData = await peopleRes.json();
      setEvents(eventsData.events ?? []);
      setPeople(peopleData.people ?? []);
    } catch {
      setError("Could not load your data. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function toggleLost(person: Person) {
    const nextLost = person.status !== "LOST";
    const res = await fetch(`/api/guardian/people/${person.id}/lost`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lost: nextLost }),
    });
    if (res.ok) refresh();
  }

  async function deletePerson(person: Person) {
    if (!confirm(`Delete all data for ${person.firstName}? This cannot be undone.`)) return;
    const res = await fetch(`/api/guardian/people/${person.id}`, { method: "DELETE" });
    if (res.ok) refresh();
  }

  if (loading) return <p className="text-center text-zinc-500">Loading...</p>;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-zinc-900">My family</h1>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
        >
          {showForm ? "Close" : "+ Add person"}
        </button>
      </div>

      {showForm && (
        <AddPersonForm
          events={events}
          onDone={() => {
            setShowForm(false);
            refresh();
          }}
        />
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {people.length === 0 && (
        <p className="rounded-lg border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500">
          No one registered yet. Add a family member to generate their safety tag.
        </p>
      )}

      <ul className="space-y-3">
        {people.map((person) => (
          <li key={person.id} className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-zinc-900">
                  {person.firstName}{" "}
                  <span className="text-xs font-normal text-zinc-500">({person.ageGroup})</span>
                </p>
                <p className="text-xs text-zinc-500">{person.event.name}</p>
                {person.tags[0] && (
                  <p className="mt-1 text-sm text-zinc-700">
                    Code: <span className="font-mono">{person.tags[0].shortCode}</span>
                  </p>
                )}
              </div>
              {person.status === "LOST" && (
                <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-bold text-red-700">
                  LOST
                </span>
              )}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {person.tags[0] && (
                <a
                  href={`/api/guardian/people/${person.id}/tag/pdf`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700"
                >
                  Download tag PDF
                </a>
              )}
              <button
                onClick={() => toggleLost(person)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                  person.status === "LOST"
                    ? "bg-emerald-600 text-white"
                    : "bg-red-600 text-white"
                }`}
              >
                {person.status === "LOST" ? "Mark found / cancel" : "My child/elder is lost"}
              </button>
              <button
                onClick={() => deletePerson(person)}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-red-600 underline"
              >
                Delete data
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AddPersonForm({ events, onDone }: { events: EventOption[]; onDone: () => void }) {
  const [eventId, setEventId] = useState(events[0]?.id ?? "");
  const [firstName, setFirstName] = useState("");
  const [ageGroup, setAgeGroup] = useState("CHILD");
  const [languages, setLanguages] = useState("");
  const [medicalNotes, setMedicalNotes] = useState("");
  const [backup1Name, setBackup1Name] = useState("");
  const [backup1Phone, setBackup1Phone] = useState("");
  const [backup2Name, setBackup2Name] = useState("");
  const [backup2Phone, setBackup2Phone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!eventId && events[0]) setEventId(events[0].id);
  }, [events, eventId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!eventId) {
      setError("No active event available for registration.");
      return;
    }
    setSubmitting(true);
    const backupContacts = [
      backup1Name && backup1Phone ? { name: backup1Name, phone: backup1Phone } : null,
      backup2Name && backup2Phone ? { name: backup2Name, phone: backup2Phone } : null,
    ].filter(Boolean);

    const res = await fetch("/api/guardian/people", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventId,
        firstName,
        ageGroup,
        languages: languages
          .split(",")
          .map((l) => l.trim())
          .filter(Boolean),
        medicalNotes: medicalNotes || null,
        backupContacts,
      }),
    });
    setSubmitting(false);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Could not save");
      return;
    }
    onDone();
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-lg border border-zinc-200 bg-white p-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700">Event</label>
        <select
          value={eventId}
          onChange={(e) => setEventId(e.target.value)}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2"
        >
          {events.length === 0 && <option value="">No active events</option>}
          {events.map((ev) => (
            <option key={ev.id} value={ev.id}>
              {ev.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700">First name</label>
        <input
          required
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700">Age group</label>
        <select
          value={ageGroup}
          onChange={(e) => setAgeGroup(e.target.value)}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2"
        >
          <option value="CHILD">Child</option>
          <option value="ADULT">Adult</option>
          <option value="ELDER">Elder</option>
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700">
          Languages spoken (comma separated)
        </label>
        <input
          value={languages}
          onChange={(e) => setLanguages(e.target.value)}
          placeholder="Gujarati, English"
          className="w-full rounded-lg border border-zinc-300 px-3 py-2"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700">
          Medical notes (optional, only visible to volunteers)
        </label>
        <textarea
          value={medicalNotes}
          onChange={(e) => setMedicalNotes(e.target.value)}
          placeholder="Allergies, diabetes, dementia, hearing/speech difficulty, medication..."
          className="w-full rounded-lg border border-zinc-300 px-3 py-2"
        />
      </div>

      <p className="pt-2 text-sm font-medium text-zinc-700">Backup contacts (optional, up to 2)</p>
      <div className="grid grid-cols-2 gap-2">
        <input
          value={backup1Name}
          onChange={(e) => setBackup1Name(e.target.value)}
          placeholder="Name"
          className="rounded-lg border border-zinc-300 px-3 py-2"
        />
        <input
          value={backup1Phone}
          onChange={(e) => setBackup1Phone(e.target.value)}
          placeholder="+91..."
          className="rounded-lg border border-zinc-300 px-3 py-2"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input
          value={backup2Name}
          onChange={(e) => setBackup2Name(e.target.value)}
          placeholder="Name"
          className="rounded-lg border border-zinc-300 px-3 py-2"
        />
        <input
          value={backup2Phone}
          onChange={(e) => setBackup2Phone(e.target.value)}
          placeholder="+91..."
          className="rounded-lg border border-zinc-300 px-3 py-2"
        />
      </div>

      <p className="text-xs text-zinc-500">
        By continuing you consent to storing this information for the duration of the event.
        Medical notes and photos are deleted 30 days after the event ends, and you can delete
        this data at any time.
      </p>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        disabled={submitting}
        className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 font-medium text-white disabled:opacity-50"
      >
        {submitting ? "Saving..." : "Save and generate tag"}
      </button>
    </form>
  );
}
