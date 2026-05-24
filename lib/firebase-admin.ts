import "server-only"

import { cert, getApps, initializeApp } from "firebase-admin/app"
import { getAuth } from "firebase-admin/auth"

function cleanEnv(value: string | undefined) {
  return value?.trim().replace(/^['"]|['"]$/g, "")
}

function getAdminApp() {
  const existingApp = getApps()[0]
  if (existingApp) {
    return existingApp
  }

  const projectId = cleanEnv(process.env.FIREBASE_PROJECT_ID) || cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID)
  const clientEmail = cleanEnv(process.env.FIREBASE_CLIENT_EMAIL)
  const privateKey = cleanEnv(process.env.FIREBASE_PRIVATE_KEY)?.replace(/\\n/g, "\n")

  if (!clientEmail || !privateKey) {
    throw new Error("Firebase Admin credentials are not configured. Set FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY.")
  }

  return initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
    projectId,
  })
}

export async function deleteFirebaseAuthUser(firebaseUid: string) {
  const hasCredentials = Boolean(
    cleanEnv(process.env.FIREBASE_CLIENT_EMAIL) && cleanEnv(process.env.FIREBASE_PRIVATE_KEY)
  )

  if (!hasCredentials) {
    return { deleted: false as const, skipped: true as const }
  }

  const auth = getAuth(getAdminApp())

  try {
    await auth.deleteUser(firebaseUid)
    return { deleted: true as const }
  } catch (error) {
    const authError = error as { code?: string }

    if (authError.code === "auth/user-not-found") {
      return { deleted: false as const, notFound: true as const }
    }

    throw error
  }
}