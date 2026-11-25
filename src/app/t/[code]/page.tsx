"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type MeetPoint = { id: string; name: string };
type TagData = {
  tagId: string;
  tagStatus: "ACTIVE" | "LOST";
  person: { id: string; firstName: string; photoUrl: string | null; ageGroup: string; status: string };
  meetPoints: MeetPoint[];
  helpDeskNumber: string;
};

export default function FinderScanPage() {
  const params = useParams<{ code: string }>();
  const [data, setData] = useState<TagData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [meetPointId, setMeetPointId] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetch(`/api/public/tag/${params.code}`)
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error ?? "Could not load this tag.");
        return body as TagData;
      })
      .then((body) => {
        setData(body);
        if (body.meetPoints[0]) setMeetPointId(body.meetPoints[0].id);
      })
      .catch((e) => setError(e.message));
  }, [params.code]);

  async function notify() {
    if (!meetPointId) return;
    setSending(true);
    const res = await fetch(`/api/public/tag/${params.code}/notify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ meetPointId }),
    });
    setSending(false);
    const body = await res.json();
    if (!res.ok) {
      setError(body.error ?? "Could not notify the family.");
      return;
    }
    setSent(true);
  }

  if (error) {
    return (
      <main style={pageStyle}>
        <p style={{ color: "#b91c1c" }}>{error}</p>
      </main>
    );
  }

  if (!data) {
    return (
      <main style={pageStyle}>
        <p>Loading...</p>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      {data.tagStatus === "LOST" && (
        <div style={{ background: "#fee2e2", color: "#991b1b", padding: 10, borderRadius: 8, marginBottom: 12, fontWeight: 700 }}>
          Marked LOST — please help right away
        </div>
      )}

      {data.person.photoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={data.person.photoUrl}
          alt={data.person.firstName}
          style={{ width: 120, height: 120, borderRadius: 12, objectFit: "cover", marginBottom: 12 }}
        />
      )}

      <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>{data.person.firstName}</h1>
      <p style={{ color: "#52525b", marginTop: 4 }}>{data.person.ageGroup.toLowerCase()}</p>

      {!sent ? (
        <>
          <p style={{ marginTop: 16 }}>
            If you&apos;ve found {data.person.firstName}, pick the nearest meet point and notify
            their family. Their phone number is kept private — only volunteers can see it.
          </p>

          <label style={{ display: "block", marginTop: 16, fontSize: 14, fontWeight: 600 }}>
            Nearest meet point
          </label>
          <select
            value={meetPointId}
            onChange={(e) => setMeetPointId(e.target.value)}
            style={selectStyle}
          >
            {data.meetPoints.map((mp) => (
              <option key={mp.id} value={mp.id}>
                {mp.name}
              </option>
            ))}
          </select>

          <button onClick={notify} disabled={sending || !meetPointId} style={buttonStyle}>
            {sending ? "Notifying..." : "Notify my family"}
          </button>
        </>
      ) : (
        <p style={{ marginTop: 16, color: "#065f46", fontWeight: 600 }}>
          The family has been notified. Please wait with {data.person.firstName} or take them to
          the meet point you selected.
        </p>
      )}

      <p style={{ marginTop: 24, fontSize: 13, color: "#71717a" }}>
        Need help? Call the Khidmat help desk: {data.helpDeskNumber}
      </p>
    </main>
  );
}

const pageStyle: React.CSSProperties = {
  maxWidth: 420,
  margin: "0 auto",
  padding: 20,
  fontFamily: "system-ui, -apple-system, sans-serif",
};

const selectStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  padding: 10,
  marginTop: 6,
  border: "1px solid #d4d4d8",
  borderRadius: 8,
  fontSize: 16,
};

const buttonStyle: React.CSSProperties = {
  marginTop: 16,
  width: "100%",
  padding: 14,
  background: "#18181b",
  color: "white",
  border: "none",
  borderRadius: 8,
  fontSize: 16,
  fontWeight: 600,
};
