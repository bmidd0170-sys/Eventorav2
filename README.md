
# Eventora

Live demo: https://eventorav2.vercel.app

Eventora is an event management web application built with Next.js (App Router), TypeScript, Prisma (PostgreSQL), Firebase (social features), and several modern UI/tooling libraries. It provides event creation, guest lists, invitations, editor tools, and a small social layer for connections and requests.

**Quick Links**
- **Source:** This repository (root)
- **Main app folder:** [app/](app/)
- **Prisma schema:** [prisma/schema.prisma](prisma/schema.prisma)
- **Prisma client:** [lib/prisma.ts](lib/prisma.ts)
- **Firebase helpers:** [lib/firebase.ts](lib/firebase.ts)
- **Editor AI route:** [app/api/editor/ai/route.ts](app/api/editor/ai/route.ts)

**Stack & Key Tech**
- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript (strict)
- **Styling:** Tailwind CSS (v4) via `@tailwindcss/postcss` + `tw-animate-css` and shadcn/ui
- **Database:** PostgreSQL via Prisma (Neon recommended)
- **Auth & Social:** Firebase Auth + Firestore (connections/requests)
- **AI:** OpenAI integration for editor assistant (optional, uses `OPENAI_API_KEY`)
- **Maps:** Google Maps (lazy-loaded using `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`)

**Local Setup**
1. Install dependencies (use pnpm; lockfile is authoritative):

```bash
pnpm install
```

2. Development server:

```bash
pnpm dev
# (Next dev; ensure nothing else is running on port 3000)
```

3. Build (note: Next build may ignore TS errors; verify with the typecheck command below):

```bash
pnpm build
```

4. Typecheck and lint:

```bash
npx tsc --noEmit    # full TypeScript check
pnpm lint           # eslint .
```

5. Prisma commands (after schema changes):

```bash
npx prisma generate
npx prisma db push
```

**Environment Variables**
- `DATABASE_URL` — PostgreSQL connection string (Neon recommended)
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` — Google Maps API key for map features
- `OPENAI_API_KEY` — optional; used by the editor AI route
- Firebase config for auth + Firestore (see `lib/firebase.ts`)

**Project Routes (high level)**
- `/` — Landing (public)
- `/(auth)/sign-in` — Sign in
- `/(auth)/get-started` — Sign up
- `/(app)/` — App shell and authenticated pages
- App pages include: `dashboard`, `events`, `builder`, `editor`, `home`, `settings`, `connections`, `guest-list`, `preview`, `publish`

Check the `app/` folder for individual route implementations.

**Important Files**
- App layout and global styles: [app/layout.tsx](app/layout.tsx) and [app/globals.css](app/globals.css)
- App shell: [app/(app)/layout.tsx](app/(app)/layout.tsx)
- API routes: [app/api/](app/api/)
- Prisma schema: [prisma/schema.prisma](prisma/schema.prisma)
- DB client: [lib/prisma.ts](lib/prisma.ts)
- Firebase helpers: [lib/firebase.ts](lib/firebase.ts)

**Developer Notes & Gotchas**
- Use `pnpm` (the `pnpm-lock.yaml` is authoritative); `package-lock.json` is stale.
- `next build` ignores TypeScript errors — always run `npx tsc --noEmit` before releasing.
- The project is generated from a v0.app boilerplate — some patterns follow that generator.
- Styles: `app/globals.css` is the authoritative stylesheet; `styles/globals.css` is leftover and not used.
- Dual persistence: main app data (users, events, invitations, guest lists) in PostgreSQL/Prisma; social features (connections/requests) in Firebase Firestore.
- Vercel Analytics only renders in production mode.

**Testing & Utilities**
- Small helper scripts are in `scripts/` such as `test-prisma.js` (verify DB connectivity) and `test-smtp.js`.

**Contributing**
- Fork/branch, make changes, run linters and `npx tsc --noEmit` before opening a PR.

If you'd like, I can also:
- commit this README change and push it to the repo
- add more docs (architecture diagram, ER diagram, or setup for production deploy)

**Best Practices**

- **Package manager:** Use `pnpm` for installs and scripts — `pnpm-lock.yaml` is authoritative; ignore `package-lock.json`.
- **Type checking:** Always run `npx tsc --noEmit` before merging or releasing. `next build` can skip TS errors.
- **Lint & format:** Run `pnpm lint` and your preferred formatter before opening PRs. Keep ESLint warnings minimal.
- **Local dev:** Start with `pnpm dev`. Ensure nothing else is using port 3000.
- **Environment variables & secrets:** Store runtime secrets in `.env.local` (never commit). Configure CI/Vercel environment variables for production keys (DB, Firebase, OpenAI, Google Maps).
- **Prisma workflow:** After schema edits run `npx prisma generate`. For local iterative work you can use `npx prisma db push` to sync quickly, but prefer `prisma migrate` (e.g. `npx prisma migrate dev`) and checked migrations for production deployments.
- **Database & backups:** Use Neon or a managed Postgres in production. Keep a separate staging DB and take regular backups before running migrations in production.
- **Firebase:** Keep Firestore security rules and Firebase config in environment variables. Don't store service account keys in the repo.
- **AI & third-party keys:** Provide `OPENAI_API_KEY` only where required. Add usage limits and monitor costs for OpenAI integrations.
- **Commit & PR hygiene:** Create feature branches, run `npx tsc --noEmit` + `pnpm lint`, include small focused commits, and write descriptive PRs.
- **Testing:** No test framework is preconfigured — add unit/integration tests if you touch core logic (recommended for backend logic and Prisma queries).
- **CI checks:** Add a CI step to run `npx tsc --noEmit` and `pnpm lint` on PRs to prevent regressions.
- **Styling & UI:** `app/globals.css` is authoritative for styles; `styles/globals.css` is leftover. Respect shadcn/ui patterns and Tailwind utilities; prefer components over ad-hoc styles.

If you want, I can also commit this change, open a PR, or add a small CI job to run the typecheck + lint on PRs.
