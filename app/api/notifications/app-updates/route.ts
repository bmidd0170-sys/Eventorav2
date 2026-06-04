import { NextRequest, NextResponse } from "next/server"

import { buildAppUpdateEmail } from "@/lib/email-templates"
import { sendEmail } from "@/lib/email"
import { defaultNotificationSettings } from "@/lib/notification-settings"
import { prisma } from "@/lib/db"
import { internalServerError } from "@/lib/api/responses"
import { ok } from "@/lib/api/success"

type Body = {
    headline?: string
    summary?: string
    link?: string
}

export async function POST(req: NextRequest) {
    try {
        const body = (await req.json().catch(() => ({}))) as Body
        const headline = typeof body.headline === "string" && body.headline.trim() ? body.headline.trim() : "Invyra product update"
        const summary = typeof body.summary === "string" && body.summary.trim() ? body.summary.trim() : "We shipped updates to Invyra to improve your event planning workflow."
        const link = typeof body.link === "string" && body.link.trim() ? body.link.trim() : undefined

        const users = await prisma.user.findMany({
            select: {
                email: true,
                notificationSettings: {
                    select: {
                        emailAppUpdates: true,
                    },
                },
            },
        })

        const emailContent = buildAppUpdateEmail({
            headline,
            summary,
            eventUrl: link,
        })

        let sentCount = 0
        await Promise.allSettled(
            users
                .filter((user) => {
                    return user.notificationSettings?.emailAppUpdates ?? defaultNotificationSettings.emailAppUpdates
                })
                .map(async (user) => {
                    await sendEmail({
                        to: user.email,
                        subject: emailContent.subject,
                        text: emailContent.text,
                        html: emailContent.html,
                        fromName: "Invyra",
                    })
                    sentCount += 1
                })
        )

        return ok({ sentCount })
    } catch (error) {
        console.error("App updates email error:", error)
        return internalServerError("Failed to send app update emails")
    }
}
