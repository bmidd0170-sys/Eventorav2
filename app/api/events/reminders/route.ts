import { NextRequest, NextResponse } from "next/server"

import { buildEventReminderEmail } from "@/lib/email-templates"
import { getUserBrandVoice } from "@/lib/brand-voice"
import { sendEmail } from "@/lib/email"
import { prisma } from "@/lib/db"
import { defaultNotificationSettings } from "@/lib/notification-settings"
import { internalServerError } from "@/lib/api/responses"
import { ok } from "@/lib/api/success"

type ReminderBody = {
    eventId?: string
    daysAhead?: number
}

export async function POST(req: NextRequest) {
    try {
        const body = (await req.json().catch(() => ({}))) as ReminderBody
        const eventId = typeof body.eventId === "string" ? body.eventId.trim() : ""
        const daysAhead = typeof body.daysAhead === "number" && Number.isFinite(body.daysAhead) ? body.daysAhead : 3

        const now = new Date()
        const upperBound = new Date(now)
        upperBound.setDate(upperBound.getDate() + daysAhead)

        const events = await prisma.event.findMany({
            where: {
                ...(eventId ? { id: eventId } : {}),
                status: "published",
                startDate: {
                    gte: now,
                    lte: upperBound,
                },
            },
            select: {
                id: true,
                title: true,
                startDate: true,
                userId: true,
                user: {
                    select: {
                        notificationSettings: true,
                    },
                },
                invitations: {
                    where: {
                        status: {
                            in: ["pending", "accepted"],
                        },
                    },
                    select: {
                        guestEmail: true,
                        guestName: true,
                    },
                },
            },
        })

        let sentCount = 0

        await Promise.allSettled(
            events.flatMap((event) => {
                const ownerSettings = event.user.notificationSettings
                    ? { ...defaultNotificationSettings, ...event.user.notificationSettings }
                    : defaultNotificationSettings
                if (!ownerSettings.emailReminders) {
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

                // Fetch event owner's personality settings
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

                    const emailContent = buildEventReminderEmail({
                        eventTitle: event.title,
                        eventDateLabel: dateLabel,
                        eventTimeLabel: timeLabel,
                        eventUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/i/${encodeURIComponent(event.id)}`,
                        tone: ownerTone,
                        signature: ownerSignature,
                    })

                    return event.invitations.map(async (invitation) => {
                        await sendEmail({
                            to: invitation.guestEmail,
                            subject: emailContent.subject,
                            text: emailContent.text,
                            html: emailContent.html,
                            fromName: event.title,
                        })
                        sentCount += 1
                    })
                })()
            }).flat()
        )

        return ok({ sentCount, eventCount: events.length })
    } catch (error) {
        console.error("Event reminders error:", error)
        return internalServerError("Failed to send reminders")
    }
}
