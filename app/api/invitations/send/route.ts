import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { jwtDecode } from "jwt-decode"
import { randomBytes } from "crypto"
import { sendEmail } from "@/lib/email"

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
    } catch (err) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const firebaseUid = decodedToken.sub
    if (!firebaseUid) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const body = await req.json()
    const { eventId, emails, subject, message } = body

    if (!eventId || !emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json({ error: "Missing eventId or emails" }, { status: 400 })
    }

    // Get the user
    const dbUser = await prisma.user.findUnique({ where: { firebaseUid } })
    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Verify the user owns this event
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { userId: true, title: true }
    })

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    if (event.userId !== dbUser.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

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

    return NextResponse.json({
      success: true,
      invitations: createdInvitations,
      count: createdInvitations.length,
      emailResults: emailResults,
    }, { status: 200 })
  } catch (error) {
    console.error("Error sending invitations:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
