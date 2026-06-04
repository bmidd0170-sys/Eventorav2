# Firebase Auth + Neon/Postgres Alignment Plan

## Current Issues

1. Firebase client auth failed with `auth/invalid-api-key`, blocking signup/sign-in.
2. API auth had duplicated token parsing and user resolution across multiple routes.
3. Route auth and DB concerns were spread across mixed utility files, making ownership and security checks drift over time.
4. Documentation still described Firestore-backed social features even though PostgreSQL/Prisma is the active data store.
5. Server-side Firebase token verification is optional and only active when Admin credentials are configured.

## Target Architecture

- Authentication provider: Firebase Authentication (client SDK for login/signup).
- Database provider: Neon PostgreSQL through Prisma.
- Auth boundary:
  - Client auth module: `lib/auth/client.ts`
  - Server auth module: `lib/auth/server.ts`
- Database boundary:
  - DB access module: `lib/db/index.ts`
- API routes use:
  - `getAuthenticatedDbUser` for token->DB user resolution
  - Prisma only through `lib/db`

## Project Structure (Auth + DB)

- `lib/auth/client.ts`:
  - Exposes `auth`, `db`, and `requestGoogleAccessToken` for browser flows.
- `lib/auth/server.ts`:
  - Exposes `getAuthenticatedDbUser`, `verifyFirebaseIdToken`, `hasFirebaseAdminCredentials`, and `deleteFirebaseAuthUser`.
- `lib/db/index.ts`:
  - Exposes Prisma client for all server route data access.

## API Endpoints in Auth -> DB Flow

1. `PUT /api/profile`:
   - Uses bearer token auth and creates/updates DB user profile.
2. `GET /api/profile`:
   - Resolves authenticated DB user and returns profile data.
3. `POST /api/events/list`:
   - Authenticated event list against DB user id.
4. `GET /api/auth/trace`:
   - Debug endpoint to confirm token authentication and DB user mapping.

## Remaining Action Items

1. Fix Firebase web API key/project alignment in Firebase Console (same project for API key, auth domain, and project ID).
2. Add Firebase Admin credentials in environment (`FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`) to enforce server token verification.
3. Restart dev server after env changes so `NEXT_PUBLIC_*` variables are recompiled.
4. Validate with end-to-end checks:
   - Signup/sign-in succeeds in client.
   - `/api/auth/trace` returns authenticated DB user payload.
   - User row appears/updates in PostgreSQL.
5. Optional hardening:
   - Add shared response helpers for route status/error consistency.
   - Add integration tests for auth guards and ownership checks.
