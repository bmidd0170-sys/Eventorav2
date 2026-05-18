import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { jwtDecode } from "jwt-decode"
import { buildEventCancelledEmail } from "@/lib/email-templates"
import { sendEmail } from "@/lib/email"
import { defaultNotificationSettings } from "@/lib/notification-settings"

async function getOrCreateDbUser(decodedToken: any) {
  const firebaseUid = decodedToken.sub
  if (!firebaseUid) {
    return null
  }

  let dbUser = await prisma.user.findUnique({ where: { firebaseUid } })
  if (dbUser) {
    return dbUser
  }

  const userEmail = decodedToken.email || `user+${firebaseUid}@example.com`

  const findExistingUser = async () => {
    const existingByUid = await prisma.user.findUnique({ where: { firebaseUid } })
    if (existingByUid) {
      return existingByUid
    }

    const existingByEmail = await prisma.user.findUnique({ where: { email: userEmail } })
    if (existingByEmail) {
      if (existingByEmail.firebaseUid) {
        return existingByEmail
      }

      return prisma.user.update({
        where: { email: userEmail },
        data: { firebaseUid },
      })
    }

    return null
  }

  try {
    return await prisma.user.create({
      data: {
        firebaseUid,
        email: userEmail,
        displayName: decodedToken.name || "User",
      },
    })
  } catch (createError: any) {
    if (createError.code === "P2002") {
      const existingUser = await findExistingUser()
      if (existingUser) {
        return existingUser
      }

      return null
    }

    throw createError
  }
}

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

    const dbUser = await getOrCreateDbUser(decodedToken)
    if (!dbUser) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
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
          const emailContent = buildEventCancelledEmail({
            eventTitle: event.title,
            eventDateLabel: dateLabel,
            eventTimeLabel: timeLabel,
            eventUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/i/${encodeURIComponent(event.id)}`,
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
        })
    )

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