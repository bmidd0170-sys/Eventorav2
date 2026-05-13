import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { jwtDecode } from "jwt-decode"

type DeleteRequest = {
  eventId?: string
  eventIds?: string[]
}

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
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const body = (await req.json()) as DeleteRequest
    const eventIds = Array.isArray(body.eventIds)
      ? body.eventIds.filter((id): id is string => typeof id === "string" && id.trim().length > 0)
      : typeof body.eventId === "string" && body.eventId.trim().length > 0
        ? [body.eventId]
        : []

    if (eventIds.length === 0) {
      return NextResponse.json({ error: "Missing eventId(s)" }, { status: 400 })
    }

    const firebaseUid = decodedToken.sub
    if (!firebaseUid) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const dbUser = await prisma.user.findUnique({ where: { firebaseUid } })
    if (!dbUser) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const deleted = await prisma.event.deleteMany({
      where: {
        id: { in: eventIds },
        userId: dbUser.id,
      },
    })

    if (deleted.count === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, deletedCount: deleted.count, eventIds }, { status: 200 })
  } catch (error) {
    console.error("Delete event error:", error)
    return NextResponse.json({ error: "Failed to delete event" }, { status: 500 })
  }
}