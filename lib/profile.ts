import { fetchWithAuth } from "@/lib/api-client"
import { getFriendlyResponseMessage } from "@/lib/error-utils"

export type UserProfile = {
  id: string
  email: string
  displayName: string | null
  photoUrl: string | null
  hasCompletedTutorial: boolean
  createdAt: string
  updatedAt: string
}

export async function getCurrentUserProfile(): Promise<UserProfile> {
  const response = await fetchWithAuth("/api/profile")
  if (!response.ok) {
    throw new Error(await getFriendlyResponseMessage(response, "We couldn't load your profile right now."))
  }

  const data = (await response.json()) as { user: UserProfile }
  return data.user
}

export async function saveCurrentUserProfile(profile: { displayName?: string | null; photoUrl?: string | null }) {
  const response = await fetchWithAuth("/api/profile", {
    method: "PUT",
    body: JSON.stringify(profile),
  })

  if (!response.ok) {
    throw new Error(await getFriendlyResponseMessage(response, "We couldn't save your profile right now."))
  }

  const data = (await response.json()) as { user: UserProfile }
  return data.user
}