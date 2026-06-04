import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getAuthenticatedDbUser } from "@/lib/auth/server"
import { sendEmail } from "@/lib/email"
import { buildTutorialCompleteEmail } from "@/lib/email-templates"
import { defaultNotificationSettings } from "@/lib/notification-settings"
import { internalServerError, unauthorized } from "@/lib/api/responses"
import { ok } from "@/lib/api/success"

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedDbUser(request)
    if (!authUser) {
      return unauthorized()
    }

    const updatedUser = await prisma.user.update({
      where: { id: authUser.dbUser.id },
      data: { hasCompletedTutorial: true },
    })

    const storedSettings = await prisma.userNotificationSettings.findUnique({
      where: { userId: authUser.dbUser.id },
    })
    const settings = storedSettings ? { ...defaultNotificationSettings, ...storedSettings } : defaultNotificationSettings

    if (settings.emailTutorialComplete) {
      const email = buildTutorialCompleteEmail(updatedUser.displayName || updatedUser.email)
      try {
        await sendEmail({
          to: updatedUser.email,
          subject: email.subject,
          text: email.text,
          html: email.html,
          fromName: "Invyra",
        })
      } catch (emailError) {
        console.warn("Failed to send tutorial completion email", emailError)
      }
    }

    return ok({
      success: true,
      hasCompletedTutorial: updatedUser.hasCompletedTutorial,
    })
  } catch (error: any) {
    console.error("Error completing tutorial:", error)
    return internalServerError(error?.message || "Failed to complete tutorial")
  }
}
