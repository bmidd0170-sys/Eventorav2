import { NextRequest, NextResponse } from "next/server"

import { getAuthenticatedDbUser, getOwnedEvent } from "@/lib/auth/server"
import { buildEventUnpublishedEmail } from "@/lib/email-templates"
import { sendEmail } from "@/lib/email"
import { prisma } from "@/lib/db"
import { badRequest, conflict, internalServerError, unauthorized } from "@/lib/api/responses"
import { ok } from "@/lib/api/success"

type UnpublishRequest = {
  eventId?: string
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedDbUser(req)
    if (!authUser) {
      return unauthorized()
    }

    const body = (await req.json().catch(() => ({}))) as UnpublishRequest
    const eventId = typeof body.eventId === "string" ? body.eventId.trim() : ""

    if (!eventId) {
      return badRequest("Missing eventId")
    }

    const eventResult = await getOwnedEvent(eventId, authUser.dbUser.id, {
      select: {
        id: true,
        title: true,
        status: true,
        user: {
          select: {
            displayName: true,
            email: true,
          },
        },
      },
      forbiddenMessage: "Unauthorized",
    })
    if (eventResult.response) {
      return eventResult.response
    }

    const event = eventResult.event

    if (event.status !== "published") {
      return conflict("Invitation is already unpublished", { eventId, status: event.status })
    }

    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: {
        status: "draft",
        updatedAt: new Date(),
      },
    })

    const connections = await prisma.socialConnection.findMany({
      where: {
        userId: authUser.dbUser.id,
        status: "accepted",
      },
      select: {
        connectedUserEmail: true,
      },
    })

    const emailContent = buildEventUnpublishedEmail({
      eventTitle: event.title,
    })

    const deliveryResults = await Promise.allSettled(
      connections
        .filter((connection) => connection.connectedUserEmail)
        .map((connection) =>
          sendEmail({
            to: connection.connectedUserEmail,
            subject: emailContent.subject,
            text: emailContent.text,
            html: emailContent.html,
            fromName: event.user.displayName || event.user.email,
          })
        )
    )

    return ok({
      success: true,
      eventId,
      status: updatedEvent.status,
      notificationsSent: deliveryResults.length,
    })
  } catch (error) {
    console.error("Unpublish error:", error)
    return internalServerError("Failed to unpublish invitation")
  }
}