# Invyra — Event invitation platform

## Commands

```bash
pnpm install        # pnpm-lock.yaml is authoritative; package-lock.json is stale
pnpm dev            # next dev — kill prior server on port 3000 first
pnpm build          # runs `prisma generate && next build`; ignores TS errors
pnpm lint           # eslint .
npx tsc --noEmit    # actual typecheck — build does NOT catch type errors
npx prisma generate # after schema changes
npx prisma db push  # sync schema to Neon/Postgres without migration files
scripts/test-smtp.js # sends an SMTP test to SMTP_USER (requires .env)
```

No test framework is configured.

## Stack

- **Next.js 16** App Router, React 19, TypeScript strict, `@/*` → project root
- **Tailwind v4** via `@tailwindcss/postcss` + `tw-animate-css`. Theme in `app/globals.css` (`@theme inline`, no `tailwind.config.js`)
- **shadcn/ui** New York, RSC, lucide. Add: `npx shadcn@latest add <name>`
- **Dark-only**: `<html className="dark">` in `app/layout.tsx:48`
- **Prisma** — PostgreSQL via Neon (`DATABASE_URL`). Client: `@/lib/prisma.ts`
- **Firebase Auth** (`@/lib/firebase.ts`) + **Firebase Firestore** (social features)
- **OpenAI** — editor AI assistant at `app/api/editor/ai/route.ts` (uses `OPENAI_API_KEY`, falls back to canned replies)
- **Google Maps** — loaded lazily in root layout via `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- **nodemailer** — SMTP emails via `lib/email.ts`. Config: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `SMTP_FROM_NAME`

## Email system

All email flows use `lib/email.ts` (nodemailer) via `lib/email-templates.ts` for template builders. Two sending patterns exist:

**Direct `sendEmail()`** — used for: invitation send, RSVP confirmations (to guest + owner), event unpublish/cancel reminders, tutorial complete, app updates, welcome signup.

**`sendEmailIfAllowed()`** — wrapper in `lib/notifications.ts` and `app/api/connections/route.ts` that checks `UserNotificationSettings` before sending. Used for: connection requests and connection accepted.

### SMTP config (from `.env`)

```
SMTP_HOST      smtp.gmail.com
SMTP_PORT      587
SMTP_SECURE    false
SMTP_USER      Braydenmiddlebrooks@gmail.com
SMTP_PASS      (App Password)
SMTP_FROM      notifications@invyra.com
SMTP_FROM_NAME Invyra
```

### Email triggers per API endpoint

| Endpoint | Trigger | Recipient | Template | Respects settings? |
|----------|---------|-----------|----------|--------------------|
| `POST /api/invitations/send` | User sends invitations from builder | Guest(s) | Inline HTML (custom subject/message) | No |
| `POST /api/invitations/respond` | Guest RSVPs (attending/not-attending) | Guest → confirmation, Owner → update | `buildRsvpConfirmationEmail`, `buildRsvpUpdateEmail` | Owner checks `emailRsvp` |
| `POST /api/events/delete` | User deletes published event(s) | All non-declined guests | `buildEventCancelledEmail` | Checks `emailEventCancelled` (⚠️ not in schema — always undefined = always sends) |
| `POST /api/events/unpublish` | User unpublishes event | All connected users | `buildEventUnpublishedEmail` | No |
| `POST /api/events/reminders` | Send reminders for upcoming events | All pending/accepted guests | `buildEventReminderEmail` | Checks `emailReminders` |
| `POST /api/profile/tutorial-complete` | User finishes tutorial | User themselves | `buildTutorialCompleteEmail` | Checks `emailTutorialComplete` (⚠️ not in schema — always undefined = never sends) |
| `POST /api/connections` (send) | User sends connection request | Recipient | Inline HTML | Checks `emailConnectionsRequests` |
| `POST /api/connections` (accept) | User accepts connection request | Both parties | Inline HTML | Checks `emailConnectionsAccepted` |
| `POST /api/send-email` | Generic delegate (frontend calls it after signup) | Arbitrary | Caller-supplied | No |
| `POST /api/notifications/app-updates` | Admin broadcasts product update | All opted-in users | `buildAppUpdateEmail` | Checks `emailAppUpdates` (⚠️ not in schema — always undefined = always sends) |
| Signup form (client-side) | User creates account via email/password | User | `buildWelcomeEmail` | No |

### Settings gap

`Prisma.UserNotificationSettings` has columns: `emailRsvp`, `emailReminders`, `emailSecurity`, `emailMarketing`, `emailConnectionsRequests`, `emailConnectionsAccepted`. But the code also checks `emailTutorialComplete`, `emailAppUpdates`, and `emailEventCancelled` — these columns are **missing from the Prisma schema**. At runtime they evaluate as `undefined`, causing tutorial complete to never send and app-updates/event-cancelled to always send (or vice versa depending on the truthiness check).

## Routes

| Path | Page |
|------|------|
| `/` | Landing (public) |
| `/(auth)/sign-in` | Sign in (email/password + Google) |
| `/(auth)/get-started` | Sign up |
| `/(auth)/forgot-password` | Forgot password |
| `/(app)/` | App shell with AppNavigation |
| `/(app)/{dashboard,events,builder,editor,home,settings,connections,guest-list,preview,publish}` | App pages |
| `/api/invitations/send` | POST — send invitations via email |
| `/api/invitations/respond` | POST — guest RSVP |
| `/api/events/reminders` | POST — send event reminders |
| `/api/events/delete` | POST — delete event(s) + notify guests |
| `/api/events/unpublish` | POST — unpublish + notify connections |
| `/api/connections` | GET/POST — manage connections/requests |
| `/api/notification-settings` | GET/PUT — per-user email/pref toggles |
| `/api/send-email` | POST — delegate email sending (no auth) |
| `/api/notifications/app-updates` | POST — broadcast to all opted-in users |
| `/api/profile/tutorial-complete` | POST — mark tutorial done + send email |

## Gotchas

- `next build` ignores TS errors; always verify with `npx tsc --noEmit`.
- `package-lock.json` is stale — use `pnpm` not `npm`.
- `styles/globals.css` is orphaned shadcn default — not imported; `app/globals.css` is real.
- `.env` values may have surrounding quotes — `lib/firebase.ts` uses `cleanEnv()` to strip them.
- `postcss` pinned via `overrides` in `package.json` — don't upgrade independently of Tailwind v4.
- Dual persistence: main data (users, events, invitations, guest lists) in PostgreSQL via Prisma; social features (connections, requests, notifications) in PostgreSQL too (not Firestore despite `AGENTS.md` older claim — `SocialConnection` and `ConnectionRequest` are Prisma models).
- Vercel Analytics renders only in `production` (`app/layout.tsx`).
