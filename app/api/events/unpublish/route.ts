import { NextRequest, NextResponse } from "next/server"

import { getAuthenticatedDbUser } from "@/lib/api-auth"
import { buildEventUnpublishedEmail } from "@/lib/email-templates"
import { sendEmail } from "@/lib/email"
import { prisma } from "@/lib/prisma"

type UnpublishRequest = {
  eventId?: string
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedDbUser(req)
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = (await req.json().catch(() => ({}))) as UnpublishRequest
    const eventId = typeof body.eventId === "string" ? body.eventId.trim() : ""

    if (!eventId) {
      return NextResponse.json({ error: "Missing eventId" }, { status: 400 })
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        title: true,
        status: true,
        userId: true,
        user: {
          select: {
            displayName: true,
            email: true,
          },
        },
      },
    })

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    if (event.userId !== authUser.dbUser.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    if (event.status !== "published") {
      return NextResponse.json(
        { error: "Invitation is already unpublished", eventId, status: event.status },
        { status: 409 }
      )
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

    return NextResponse.json(
      {
        success: true,
        eventId,
        status: updatedEvent.status,
        notificationsSent: deliveryResults.length,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Unpublish error:", error)
    return NextResponse.json({ error: "Failed to unpublish invitation" }, { status: 500 })
  }
}