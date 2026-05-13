import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { jwtDecode } from "jwt-decode"

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.slice(7)
    let decodedToken: any
    try {
      decodedToken = jwtDecode(token) as any
    } catch (err) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const firebaseUid = decodedToken.sub
    if (!firebaseUid) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const body = await req.json()
    const eventId = body.eventId as string

    if (!eventId) {
      return NextResponse.json({ error: "Missing eventId" }, { status: 400 })
    }

    // Get the user
    const dbUser = await prisma.user.findUnique({ where: { firebaseUid } })
    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Verify the user owns this event
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { userId: true }
    })

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    if (event.userId !== dbUser.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Fetch invitations for this event
    const invitations = await prisma.invitation.findMany({
      where: { eventId },
      select: {
        id: true,
        guestEmail: true,
        guestName: true,
        status: true,
        respondedAt: true,
        sentAt: true,
      },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json({ invitations }, { status: 200 })
  } catch (error) {
    console.error("Error fetching invitations:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
