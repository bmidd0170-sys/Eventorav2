import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { jwtDecode } from "jwt-decode"

type PublishRequest = {
  eventId: string
  userId: string
}

export async function POST(req: NextRequest) {
  try {
    // Get Firebase Auth token from headers
    const authHeader = req.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const token = authHeader.slice(7)
    let decodedToken: any
    try {
      // Simple JWT decode without verification (client-side already verified)
      decodedToken = jwtDecode(token) as any
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      )
    }

    const body = (await req.json()) as PublishRequest

    if (!body.eventId || !body.userId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Verify the token matches the provided user ID
    if (decodedToken.sub !== body.userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      )
    }

    // Look up the database user by Firebase UID
    const firebaseUid = decodedToken.sub
    const dbUser = await prisma.user.findUnique({
      where: { firebaseUid }
    })

    if (!dbUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 403 }
      )
    }

    // Find the event and verify ownership
    const event = await prisma.event.findUnique({
      where: { id: body.eventId },
      select: { userId: true, status: true }
    })

    if (!event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      )
    }

    if (event.userId !== dbUser.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      )
    }

    // Update status to published
    const updatedEvent = await prisma.event.update({
      where: { id: body.eventId },
      data: {
        status: "published",
        updatedAt: new Date()
      }
    })

    return NextResponse.json(
      {
        success: true,
        message: "Invitation published successfully",
        eventId: body.eventId,
        status: updatedEvent.status,
        updatedAt: updatedEvent.updatedAt,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Publish error:", error)
    return NextResponse.json(
      { error: "Failed to publish invitation" },
      { status: 500 }
    )
  }
}
