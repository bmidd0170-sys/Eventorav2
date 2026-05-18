import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthenticatedDbUser } from "@/lib/api-auth"
import { defaultNotificationSettings, type NotificationSettings } from "@/lib/notification-settings"

function serializeSettings(settings: NotificationSettings) {
  return { ...settings }
}

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedDbUser(req)
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const stored = await prisma.userNotificationSettings.findUnique({
      where: { userId: authUser.dbUser.id },
    })

    const settings = stored
      ? {
          emailWelcome: stored.emailWelcome,
          emailTutorialComplete: stored.emailTutorialComplete,
          emailRsvp: stored.emailRsvp,
          emailReminders: stored.emailReminders,
          emailSecurity: stored.emailSecurity,
          emailMarketing: stored.emailMarketing,
          emailConnectionsOutgoing: stored.emailConnectionsOutgoing,
          emailConnectionsIncoming: stored.emailConnectionsIncoming,
          emailConnectionsAccepted: stored.emailConnectionsAccepted,
          emailEventCancelled: stored.emailEventCancelled,
          emailAppUpdates: stored.emailAppUpdates,
          pushRsvp: stored.pushRsvp,
          pushReminders: stored.pushReminders,
          pushTips: stored.pushTips,
          pushConnectionsRequests: stored.pushConnectionsRequests,
          pushConnectionsAccepted: stored.pushConnectionsAccepted,
        }
      : defaultNotificationSettings

    return NextResponse.json({ settings: serializeSettings(settings) }, { status: 200 })
  } catch (error) {
    console.error("Notification settings load error:", error)
    return NextResponse.json({ error: "Failed to load notification settings" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedDbUser(req)
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = (await req.json()) as Partial<NotificationSettings>
    const merged = { ...defaultNotificationSettings, ...body }

    const saved = await prisma.userNotificationSettings.upsert({
      where: { userId: authUser.dbUser.id },
      create: {
        userId: authUser.dbUser.id,
        ...merged,
      },
      update: merged,
    })

    return NextResponse.json({
      settings: {
        emailWelcome: saved.emailWelcome,
        emailTutorialComplete: saved.emailTutorialComplete,
        emailRsvp: saved.emailRsvp,
        emailReminders: saved.emailReminders,
        emailSecurity: saved.emailSecurity,
        emailMarketing: saved.emailMarketing,
        emailConnectionsOutgoing: saved.emailConnectionsOutgoing,
        emailConnectionsIncoming: saved.emailConnectionsIncoming,
        emailConnectionsAccepted: saved.emailConnectionsAccepted,
        emailEventCancelled: saved.emailEventCancelled,
        emailAppUpdates: saved.emailAppUpdates,
        pushRsvp: saved.pushRsvp,
        pushReminders: saved.pushReminders,
        pushTips: saved.pushTips,
        pushConnectionsRequests: saved.pushConnectionsRequests,
        pushConnectionsAccepted: saved.pushConnectionsAccepted,
      },
    })
  } catch (error) {
    console.error("Notification settings save error:", error)
    return NextResponse.json({ error: "Failed to save notification settings" }, { status: 500 })
  }
}