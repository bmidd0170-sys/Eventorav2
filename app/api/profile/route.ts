import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthenticatedDbUser } from "@/lib/api-auth"

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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    return NextResponse.json({ user: serializeUser(authUser.dbUser) }, { status: 200 })
  } catch (error) {
    console.error("Profile load error:", error)
    return NextResponse.json({ error: "Failed to load profile" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedDbUser(req)
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
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

    return NextResponse.json({ user: serializeUser(updatedUser) }, { status: 200 })
  } catch (error) {
    console.error("Profile save error:", error)
    return NextResponse.json({ error: "Failed to save profile" }, { status: 500 })
  }
}