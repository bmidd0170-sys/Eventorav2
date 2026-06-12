import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getAuthenticatedDbUser } from "@/lib/auth/server"
import { getUserBrandVoice } from "@/lib/brand-voice"
import { buildEventCancelledEmail } from "@/lib/email-templates"
import { sendEmail } from "@/lib/email"
import { defaultNotificationSettings } from "@/lib/notification-settings"
import { badRequest, internalServerError, notFound, unauthorized } from "@/lib/api/responses"
import { ok } from "@/lib/api/success"

type DeleteRequest = {
  eventId?: string
  eventIds?: string[]
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await getAuthenticatedDbUser(req)
    if (!authResult) {
      return unauthorized()
    }

    const { dbUser } = authResult

    const body = (await req.json()) as DeleteRequest
    const eventIds = Array.isArray(body.eventIds)
      ? body.eventIds.filter((id): id is string => typeof id === "string" && id.trim().length > 0)
      : typeof body.eventId === "string" && body.eventId.trim().length > 0
        ? [body.eventId]
        : []

    if (eventIds.length === 0) {
      return badRequest("Missing eventId(s)")
    }

    const events = await prisma.event.findMany({
      where: {
        id: { in: eventIds },
        userId: dbUser.id,
      },
      select: {
        id: true,
        title: true,
        startDate: true,
        status: true,
        userId: true,
        user: {
          select: {
            notificationSettings: true,
          },
        },
        invitations: {
          select: {
            guestEmail: true,
            guestName: true,
          },
          where: {
            status: {
              not: "declined",
            },
          },
        },
      },
    })

    await Promise.allSettled(
      events
        .filter((event) => event.status === "published")
        .flatMap((event) => {
          const ownerSettings = event.user.notificationSettings
            ? { ...defaultNotificationSettings, ...event.user.notificationSettings }
            : defaultNotificationSettings
          if (!ownerSettings.emailEventCancelled) {
            return []
          }

          const dateLabel = event.startDate.toLocaleDateString(undefined, {
            month: "long",
            day: "numeric",
            year: "numeric",
          })
          const timeLabel = event.startDate.toLocaleTimeString(undefined, {
            hour: "numeric",
            minute: "2-digit",
          })
          
          return (async () => {
            let ownerSignature: string | undefined
            let ownerTone: "formal" | "casual" | "playful" | "warm" | "direct" | undefined
            try {
              const ownerVoice = await getUserBrandVoice(event.userId)
              ownerTone = ownerVoice?.tone
              ownerSignature = ownerVoice?.signature
            } catch (error) {
              console.warn("Failed to fetch owner's brand voice", error)
            }

            const emailContent = buildEventCancelledEmail({
              eventTitle: event.title,
              eventDateLabel: dateLabel,
              eventTimeLabel: timeLabel,
              eventUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/i/${encodeURIComponent(event.id)}`,
              tone: ownerTone,
              signature: ownerSignature,
            })

            return event.invitations.map((invitation) =>
              sendEmail({
                to: invitation.guestEmail,
                subject: emailContent.subject,
                text: emailContent.text,
                html: emailContent.html,
                fromName: event.title,
              })
            )
          })()
        }).flat()
    )

    const deleted = await prisma.event.deleteMany({
      where: {
        id: { in: eventIds },
        userId: dbUser.id,
      },
    })

    if (deleted.count === 0) {
      return notFound()
    }

    return ok({ success: true, deletedCount: deleted.count, eventIds })
  } catch (error) {
    console.error("Delete event error:", error)
    return internalServerError("Failed to delete event")
  }
}