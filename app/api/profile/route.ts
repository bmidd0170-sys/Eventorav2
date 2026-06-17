import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getAuthenticatedDbUser } from "@/lib/auth/server"
import { internalServerError, unauthorized } from "@/lib/api/responses"
import { ok } from "@/lib/api/success"

export const runtime = "nodejs"

function serializeUser(user: {
  id: string
  email: string
  displayName: string | null
  photoUrl: string | null
  hasCompletedTutorial: boolean
  createdAt: Date
  updatedAt: Date
}) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    photoUrl: user.photoUrl,
    hasCompletedTutorial: user.hasCompletedTutorial,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  }
}

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedDbUser(req)
    if (!authUser) {
      return unauthorized()
    }

    return ok({ user: serializeUser(authUser.dbUser) })
  } catch (error) {
    console.error("Profile load error:", error)
    return internalServerError("Failed to load profile")
  }
}

export async function PUT(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedDbUser(req)
    if (!authUser) {
      return unauthorized()
    }

    const body = await req.json()
    const displayName = typeof body.displayName === "string" ? body.displayName.trim() : undefined
    const photoUrl = typeof body.photoUrl === "string" ? body.photoUrl.trim() : undefined

    const updatedUser = await prisma.user.update({
      where: { id: authUser.dbUser.id },
      data: {
        ...(displayName !== undefined ? { displayName: displayName || null } : {}),
        ...(photoUrl !== undefined ? { photoUrl: photoUrl || null } : {}),
      },
    })

    return ok({ user: serializeUser(updatedUser) })
  } catch (error) {
    console.error("Profile save error:", error)
    return internalServerError("Failed to save profile")
  }
}