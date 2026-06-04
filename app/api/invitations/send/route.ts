import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getAuthenticatedDbUser, getOwnedEvent } from "@/lib/auth/server"
import { randomBytes } from "crypto"
import { sendEmail } from "@/lib/email"
import { badRequest, internalServerError, unauthorized } from "@/lib/api/responses"
import { ok } from "@/lib/api/success"

export async function POST(req: NextRequest) {
  try {
    const authResult = await getAuthenticatedDbUser(req)
    if (!authResult) {
      return unauthorized()
    }

    const { dbUser } = authResult

    const body = await req.json()
    const { eventId, emails, subject, message } = body

    if (!eventId || !emails || !Array.isArray(emails) || emails.length === 0) {
      return badRequest("Missing eventId or emails")
    }

    const eventResult = await getOwnedEvent(eventId, dbUser.id, {
      select: { title: true },
    })
    if (eventResult.response) {
      return eventResult.response
    }

    const event = eventResult.event

    // Create or update invitations for each email
    const createdInvitations = []
    const invitationTokens: Record<string, string> = {}

    for (const email of emails) {
      const token = randomBytes(32).toString("hex")

      // Create or update the invitation
      const invitation = await prisma.invitation.upsert({
        where: {
          eventId_guestEmail: {
            eventId,
            guestEmail: email,
          },
        },
        create: {
          eventId,
          guestEmail: email,
          status: "pending",
          token,
          sentAt: new Date(),
          userId: dbUser.id,
        },
        update: {
          status: "pending",
          sentAt: new Date(),
        },
      })

      createdInvitations.push(invitation)
      invitationTokens[email] = token
    }

    // Send emails (call your email service)
    const emailResults: { email: string; success: boolean; error?: string }[] = []
    const appUrl = req.nextUrl.origin

    for (const email of emails) {
      try {
        const inviteUrl = `${appUrl}/i/${encodeURIComponent(eventId)}`

        const htmlEmail = `
          <p>${message?.replace(/\n/g, '<br>') || "You're invited!"}</p>
          <p><a href="${inviteUrl}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">View Invitation</a></p>
        `

        await sendEmail({
          to: email,
          subject: subject || "You're Invited!",
          text: `${message || "You're invited!"}\n\n${inviteUrl}`,
          html: htmlEmail,
          fromName: event.title,
        })

        emailResults.push({ email, success: true })
        console.log(`[/api/invitations/send] Successfully sent email to ${email}`)
      } catch (emailError) {
        const errorMsg = emailError instanceof Error ? emailError.message : String(emailError)
        console.error(`[/api/invitations/send] Failed to send email to ${email}:`, errorMsg)
        emailResults.push({ email, success: false, error: errorMsg })
      }
    }

    return ok({
      success: true,
      invitations: createdInvitations,
      count: createdInvitations.length,
      emailResults: emailResults,
    })
  } catch (error) {
    console.error("Error sending invitations:", error)
    return internalServerError()
  }
}
