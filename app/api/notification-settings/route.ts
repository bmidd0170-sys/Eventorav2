import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getAuthenticatedDbUser } from "@/lib/auth/server"
import { defaultNotificationSettings, type NotificationSettings } from "@/lib/notification-settings"
import { internalServerError, unauthorized } from "@/lib/api/responses"
import { ok } from "@/lib/api/success"

function serializeSettings(settings: NotificationSettings) {
  return { ...settings }
}

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedDbUser(req)
    if (!authUser) {
      return unauthorized()
    }

    const stored = await prisma.userNotificationSettings.findUnique({
      where: { userId: authUser.dbUser.id },
    })

    const settings = stored
      ? {
        emailRsvp: stored.emailRsvp,
        emailReminders: stored.emailReminders,
        emailSecurity: stored.emailSecurity,
        emailMarketing: stored.emailMarketing,
        emailConnectionsRequests: stored.emailConnectionsRequests,
        emailConnectionsAccepted: stored.emailConnectionsAccepted,
        emailTutorialComplete: stored.emailTutorialComplete,
        emailAppUpdates: stored.emailAppUpdates,
        emailEventCancelled: stored.emailEventCancelled,
        pushRsvp: stored.pushRsvp,
        pushReminders: stored.pushReminders,
        pushTips: stored.pushTips,
        pushConnectionsRequests: stored.pushConnectionsRequests,
        pushConnectionsAccepted: stored.pushConnectionsAccepted,
      }
      : defaultNotificationSettings

    return ok({ settings: serializeSettings(settings) })
  } catch (error) {
    console.error("Notification settings load error:", error)
    return internalServerError("Failed to load notification settings")
  }
}

export async function PUT(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedDbUser(req)
    if (!authUser) {
      return unauthorized()
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

    return ok({
      settings: {
        emailRsvp: saved.emailRsvp,
        emailReminders: saved.emailReminders,
        emailSecurity: saved.emailSecurity,
        emailMarketing: saved.emailMarketing,
        emailConnectionsRequests: saved.emailConnectionsRequests,
        emailConnectionsAccepted: saved.emailConnectionsAccepted,
        emailTutorialComplete: saved.emailTutorialComplete,
        emailAppUpdates: saved.emailAppUpdates,
        emailEventCancelled: saved.emailEventCancelled,
        pushRsvp: saved.pushRsvp,
        pushReminders: saved.pushReminders,
        pushTips: saved.pushTips,
        pushConnectionsRequests: saved.pushConnectionsRequests,
        pushConnectionsAccepted: saved.pushConnectionsAccepted,
      },
    })
  } catch (error) {
    console.error("Notification settings save error:", error)
    return internalServerError("Failed to save notification settings")
  }
}