# Ashara Safety Tag

A mobile-first web app (no app install) to help reunite lost children and
elders with their families at large community gatherings.

## Stack

- Next.js (App Router, TypeScript) + Tailwind
- Postgres via Prisma (Supabase-compatible)
- Phone + OTP auth for guardians/volunteers/admins (signed-cookie sessions);
  finders need no login
- Swappable SMS/WhatsApp transport (`src/lib/notify`) — console logger in dev,
  Twilio REST adapter ready to switch on
- `qrcode` + `pdf-lib` for the printable wristband/wallet-card tags
- Vitest for the safety-critical unit tests

## Local setup

1. Copy `.env.example` to `.env` and fill in `DATABASE_URL` (a local Postgres
   or a Supabase project connection string) and `SESSION_SECRET` (any long
   random string).
2. Install dependencies and apply the schema:
   ```bash
   npm install
   npm run db:migrate
   ```
3. Seed the first admin account (there's no self-service admin signup):
   ```bash
   ADMIN_PHONE="+15551234567" ADMIN_NAME="Event Admin" npm run db:seed
   ```
4. Run the app:
   ```bash
   npm run dev
   ```

With `NOTIFY_PROVIDER=console` (the default), OTP codes and notification
SMS bodies are printed to the server log instead of being sent — handy for
local testing without a Twilio account. Set `NOTIFY_PROVIDER=twilio` and the
`TWILIO_*` variables in `.env` to send real messages.

## Typical flow to try locally

1. Log in at `/admin/login` with the seeded admin phone, create an event and
   a meet point.
2. Register a guardian at `/guardian`, add a person — this generates a tag
   (random UUID + 6-character short code) and you can download its PDF card.
3. Open `/t/<tagId>` (the QR target) in an incognito tab to see the finder
   view — no phone numbers, just a name, photo, meet points and a notify
   button.
4. Apply as a volunteer at `/volunteer/apply`, approve them from
   `/admin/volunteers`, then log in at `/volunteer/login` and look up the
   same tag's short code at `/volunteer/scan` — this view shows medical
   notes, contact numbers and the Found → Family notified → Reunited
   status control.

## Tests

```bash
npm test
```

Covers the four safety-critical behaviors called out in the spec: a finder
never receives a phone number, tags expire automatically when their event
ends, a LOST report is flagged high-priority for volunteers, and public
endpoints are rate-limited.

## Scope notes

This is the MVP slice: registration + OTP, tag PDF generation, the finder
scan/notify page, volunteer login/scan/status, and admin event setup.
Offline sync for the volunteer desk and dashboard charts are intentionally
out of scope for v1 (see the admin stats page for the numeric figures that
are in scope instead). Medical notes/photos are not yet auto-purged 30 days
after an event ends — that's a scheduled job to add before production use.
