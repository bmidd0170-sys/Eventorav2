import { auth } from "@/lib/firebase"

export async function fetchWithAuth(input: RequestInfo | URL, init: RequestInit = {}) {
  const user = auth.currentUser
  if (!user) {
    throw new Error("You must be signed in")
  }

  const token = await user.getIdToken()
  const headers = new Headers(init.headers)
  headers.set("Authorization", `Bearer ${token}`)

  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }

  return fetch(input, {
    ...init,
    headers,
  })
}