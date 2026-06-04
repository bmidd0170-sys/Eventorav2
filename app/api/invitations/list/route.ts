import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getAuthenticatedDbUser, getOwnedEvent } from "@/lib/auth/server"
import { badRequest, internalServerError, unauthorized } from "@/lib/api/responses"
import { ok } from "@/lib/api/success"

export async function POST(req: NextRequest) {
  try {
    const authResult = await getAuthenticatedDbUser(req)
    if (!authResult) {
      return unauthorized()
    }

    const { dbUser } = authResult

    const body = await req.json()
    const eventId = body.eventId as string

    if (!eventId) {
      return badRequest("Missing eventId")
    }

    const eventResult = await getOwnedEvent(eventId, dbUser.id)
    if (eventResult.response) {
      return eventResult.response
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

    return ok({ invitations })
  } catch (error) {
    console.error("Error fetching invitations:", error)
    return internalServerError()
  }
}
