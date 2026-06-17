# Invyra — Event invitation platform

## Commands

```bash
pnpm install             # postinstall → prisma generate
pnpm dev                 # next dev --webpack; kill prior process on :3000 first
pnpm build               # prisma generate && next build (ignores TS errors)
pnpm lint                # eslint . (Next.js built-in config, no eslintrc)
npx tsc --noEmit         # actual typecheck — build does NOT catch type errors
npx prisma generate      # after schema changes (auto-runs on install/build)
npx prisma db push       # sync schema to Neon/Postgres (no migration files)
scripts/test-smtp.js     # SMTP test to SMTP_USER (needs .env)
scripts/test-prisma.js   # DB connectivity test
```

No test framework is configured.

## Stack

- **Next.js 16** App Router, React 19, TypeScript strict, `@/*` → project root
- **Tailwind v4** via `@tailwindcss/postcss` + `tw-animate-css`. Theme in `app/globals.css` (`@theme inline`, no `tailwind.config.js`)
- **shadcn/ui** New York, RSC, lucide. Add: `npx shadcn@latest add <name>`
- **Dark-only**: `<html className="dark">` in `app/layout.tsx:50`
- **Prisma** — PostgreSQL via Neon (`DATABASE_URL`). Client: `@/lib/prisma.ts` (also re-exported as `@/lib/db/index.ts`)
- **Firebase Auth** (`@/lib/firebase.ts`) — Firestore `db` exported but unused; all social features in PostgreSQL via Prisma.
- **Firebase Admin** (`@/lib/firebase-admin.ts`) — optional credentials (`FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`). Without them, `verifyFirebaseIdToken()` returns null and API auth falls back to `jwtDecode()`.
- **Auth**: API routes import `getAuthenticatedDbUser()` from `@/lib/auth/server` (re-exports `@/lib/api-auth`). Decodes Firebase JWT Bearer, verifies admin-side if creds available, upserts DB user.
- **OpenAI** — editor AI assistant at `app/api/editor/ai/route.ts` (uses `OPENAI_API_KEY`, falls back to canned replies)
- **Google Maps** — loaded lazily in root layout via `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- **nodemailer** — SMTP via `lib/email.ts`. Config: `SMTP_HOST`, `SMTP_PORT` (default 587), `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `SMTP_FROM_NAME`
- Generated from **v0.app** boilerplate

## Email system

All email flows use `lib/email.ts` (nodemailer). Two patterns:

- **`sendEmail()`** — direct call in route handlers for invitations, RSVPs, event unpublish/cancel, reminders, tutorial-complete, app updates, welcome.
- **`sendEmailIfAllowed()`** — two independent implementations:
  - `lib/notifications.ts` — client-side, proxies through `POST /api/send-email`, checks `UserNotificationSettings`
  - `app/api/connections/route.ts` — server-side, inline, checks settings then calls `sendEmail()` directly

| Endpoint | Recipient | Template | Checks settings |
|----------|-----------|----------|-----------------|
| `POST /api/invitations/send` | Guest(s) | Inline HTML (custom subject/message) | No |
| `POST /api/invitations/respond` | Guest (confirmation), Owner (update) | `buildRsvpConfirmationEmail`, `buildRsvpUpdateEmail` | Owner checks `emailRsvp` |
| `POST /api/events/delete` | Non-declined guests | `buildEventCancelledEmail` | Checks `emailEventCancelled` |
| `POST /api/events/unpublish` | All connected users | `buildEventUnpublishedEmail` | No |
| `POST /api/events/reminders` | Pending/accepted guests | `buildEventReminderEmail` | Checks `emailReminders` |
| `POST /api/profile/tutorial-complete` | User themselves | `buildTutorialCompleteEmail` | Checks `emailTutorialComplete` |
| `POST /api/connections` (send) | Recipient | Inline HTML | Checks `emailConnectionsRequests` |
| `POST /api/connections` (accept) | Both parties | Inline HTML | Checks `emailConnectionsAccepted` |
| `POST /api/send-email` | Arbitrary | Caller-supplied | No |
| `POST /api/notifications/app-updates` | All opted-in users | `buildAppUpdateEmail` | Checks `emailAppUpdates` |
| Signup form (client-side) | User | `buildWelcomeEmail` | No |

Settings default to `defaultNotificationSettings` from `lib/notification-settings.ts`. Prisma schema `UserNotificationSettings` and TS type are in sync.

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

- `next build` ignores TS errors (`next.config.mjs:3-5`); always verify with `npx tsc --noEmit`.
- `package-lock.json` is stale — use `pnpm` not `npm`.
- `styles/globals.css` is orphaned shadcn default — not imported; `app/globals.css` is real.
- `.env` values may have surrounding quotes — `lib/firebase.ts` uses `cleanEnv()` to strip them.
- `postcss` pinned via `overrides` in `package.json` — don't upgrade independently of Tailwind v4.
- Social features (connections, requests) live in PostgreSQL via Prisma models (`SocialConnection`, `ConnectionRequest`), not Firestore. Firestore `db` export is unused.
- Vercel Analytics renders only in `production` (`app/layout.tsx:62`).
- `@/lib/auth/server` is the canonical import for `getAuthenticatedDbUser()` (re-exports from `@/lib/api-auth`).
- Firebase Admin credentials are optional; without them, token verification falls back to `jwtDecode()` (no server-side validation).
- `next.config.mjs:9-20` sets `Cross-Origin-Opener-Policy: same-origin-allow-popups` globally.
- `next.config.mjs:7` sets `images.unoptimized: true` — no built-in image optimization.
