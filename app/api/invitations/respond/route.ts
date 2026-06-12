import { randomUUID } from "crypto"
import { NextRequest, NextResponse } from "next/server"

import { getAuthenticatedDbUser } from "@/lib/auth/server"
import { getUserBrandVoice } from "@/lib/brand-voice"
import { buildRsvpConfirmationEmail, buildRsvpUpdateEmail } from "@/lib/email-templates"
import { sendEmail } from "@/lib/email"
import { prisma } from "@/lib/db"
import { defaultNotificationSettings } from "@/lib/notification-settings"
import { badRequest, internalServerError, notFound } from "@/lib/api/responses"
import { ok } from "@/lib/api/success"

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
            return badRequest("Missing eventId, guestEmail, or response")
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
            return notFound("Event not found")
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

        // Fetch event owner's personality settings
        let ownerSignature: string | undefined
        let ownerTone: "formal" | "casual" | "playful" | "warm" | "direct" | undefined
        try {
            const ownerVoice = await getUserBrandVoice(event.userId)
            ownerTone = ownerVoice?.tone
            ownerSignature = ownerVoice?.signature
        } catch (error) {
            console.warn("Failed to fetch owner's brand voice", error)
        }

        const guestEmailContent = buildRsvpConfirmationEmail({
            eventTitle: event.title,
            responseLabel,
            guestEmail,
            guestName,
            eventUrl,
            tone: ownerTone,
            signature: ownerSignature,
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

        return ok({ success: true, invitation })
    } catch (error) {
        console.error("RSVP response error:", error)
        return internalServerError("Failed to save RSVP")
    }
}
