import { fetchWithAuth } from "@/lib/api-client"

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
    throw new Error("Failed to load profile")
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
    throw new Error("Failed to save profile")
  }

  const data = (await response.json()) as { user: UserProfile }
  return data.user
}