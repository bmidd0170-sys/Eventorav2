import { randomUUID } from "crypto"
import { NextRequest, NextResponse } from "next/server"

import { getAuthenticatedDbUser } from "@/lib/api-auth"
import { buildRsvpConfirmationEmail, buildRsvpUpdateEmail } from "@/lib/email-templates"
import { sendEmail } from "@/lib/email"
import { prisma } from "@/lib/prisma"
import { defaultNotificationSettings } from "@/lib/notification-settings"

type Body = {
  eventId?: string
  guestEmail?: string
  guestName?: string
  response?: "attending" | "not-attending"
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Body
    const eventId = typeof body.eventId === "string" ? body.eventId.trim() : ""
    const guestEmail = typeof body.guestEmail === "string" ? body.guestEmail.trim().toLowerCase() : ""
    const guestName = typeof body.guestName === "string" ? body.guestName.trim() : ""
    const response = body.response === "attending" || body.response === "not-attending" ? body.response : null

    if (!eventId || !guestEmail || !response) {
      return NextResponse.json({ error: "Missing eventId, guestEmail, or response" }, { status: 400 })
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        title: true,
        startDate: true,
        endDate: true,
        userId: true,
        user: {
          select: {
            displayName: true,
            email: true,
            notificationSettings: true,
          },
        },
      },
    })

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    const invitation = await prisma.invitation.upsert({
      where: {
        eventId_guestEmail: {
          eventId,
          guestEmail,
        },
      },
      create: {
        id: randomUUID(),
        eventId,
        userId: event.userId,
        guestEmail,
        guestName: guestName || null,
        token: randomUUID(),
        status: response === "attending" ? "accepted" : "declined",
        respondedAt: new Date(),
      },
      update: {
        guestName: guestName || undefined,
        status: response === "attending" ? "accepted" : "declined",
        respondedAt: new Date(),
      },
    })

    const eventUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/i/${encodeURIComponent(eventId)}`
    const responseLabel = response === "attending" ? "Attending" : "Not attending"
    const reminderDate = event.startDate.toLocaleDateString(undefined, {
      month: "long",
      day: "numeric",
      year: "numeric",
    })
    const reminderTime = event.startDate.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    })

    const guestEmailContent = buildRsvpConfirmationEmail({
      eventTitle: event.title,
      responseLabel,
      guestEmail,
      guestName,
      eventUrl,
    })
    const ownerSettings = event.user.notificationSettings
      ? { ...defaultNotificationSettings, ...event.user.notificationSettings }
      : defaultNotificationSettings
    const ownerEmailContent = buildRsvpUpdateEmail({
      eventTitle: event.title,
      responseLabel,
      guestEmail,
      guestName,
      eventUrl,
    })

    const authUser = await getAuthenticatedDbUser(req)
    void authUser

    await Promise.allSettled([
      sendEmail({
        to: guestEmail,
        subject: guestEmailContent.subject,
        text: guestEmailContent.text,
        html: guestEmailContent.html,
        fromName: event.title,
      }),
      ownerSettings.emailRsvp
        ? sendEmail({
            to: event.user.email,
            subject: ownerEmailContent.subject,
            text: `${ownerEmailContent.text}\n\nEvent: ${reminderDate} at ${reminderTime}`,
            html: ownerEmailContent.html,
            fromName: event.title,
          })
        : Promise.resolve(),
    ])

    return NextResponse.json({ success: true, invitation }, { status: 200 })
  } catch (error) {
    console.error("RSVP response error:", error)
    return NextResponse.json({ error: "Failed to save RSVP" }, { status: 500 })
  }
}
