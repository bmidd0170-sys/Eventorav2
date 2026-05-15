import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthenticatedDbUser } from "@/lib/api-auth"

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedDbUser(request)
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const updatedUser = await prisma.user.update({
      where: { id: authUser.dbUser.id },
      data: { hasCompletedTutorial: true },
    })

    return NextResponse.json({
      success: true,
      hasCompletedTutorial: updatedUser.hasCompletedTutorial,
    })
  } catch (error: any) {
    console.error("Error completing tutorial:", error)
    return NextResponse.json(
      { error: error?.message || "Failed to complete tutorial" },
      { status: 500 }
    )
  }
}
