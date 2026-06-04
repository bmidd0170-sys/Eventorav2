import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getAuthenticatedDbUser, getOwnedEvent } from "@/lib/auth/server"
import { badRequest, conflict, forbidden, internalServerError, unauthorized } from "@/lib/api/responses"
import { ok } from "@/lib/api/success"

type PublishRequest = {
  eventId: string
  userId: string
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await getAuthenticatedDbUser(req)
    if (!authResult) {
      return unauthorized()
    }

    const { firebaseUid, dbUser } = authResult

    const body = (await req.json()) as PublishRequest

    if (!body.eventId || !body.userId) {
      return badRequest("Missing required fields")
    }

    // Verify the token matches the provided user ID
    if (firebaseUid !== body.userId) {
      return forbidden("Unauthorized")
    }

    const eventResult = await getOwnedEvent(body.eventId, dbUser.id, {
      select: { status: true },
      forbiddenMessage: "Unauthorized",
    })
    if (eventResult.response) {
      return eventResult.response
    }

    const event = eventResult.event

    if (event.status === "published") {
      return conflict("Invitation is already published", {
        eventId: body.eventId,
        status: event.status,
      })
    }

    // Update status to published
    const updatedEvent = await prisma.event.update({
      where: { id: body.eventId },
      data: {
        status: "published",
        updatedAt: new Date()
      }
    })

    return ok({
      success: true,
      message: "Invitation published successfully",
      eventId: body.eventId,
      status: updatedEvent.status,
      updatedAt: updatedEvent.updatedAt,
    })
  } catch (error) {
    console.error("Publish error:", error)
    return internalServerError("Failed to publish invitation")
  }
}
