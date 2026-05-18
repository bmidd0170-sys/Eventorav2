import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthenticatedDbUser } from "@/lib/api-auth"
import { defaultNotificationSettings, type NotificationSettings } from "@/lib/notification-settings"
import {
  buildConnectionRequestAcceptedEmail,
  buildConnectionRequestIncomingEmail,
  buildConnectionRequestOutgoingEmail,
} from "@/lib/email-templates"
import { sendEmail } from "@/lib/email"

function serializeConnection(connection: {
  id: string
  userId: string
  connectedUserId: string
  connectedUserName: string
  connectedUserEmail: string
  status: string
  createdAt: Date
  updatedAt: Date
  connectedUser?: {
    displayName: string | null
    email: string
    photoUrl: string | null
  } | null
}) {
  const connectedUserName = connection.connectedUser?.displayName || connection.connectedUserName
  const connectedUserEmail = connection.connectedUser?.email || connection.connectedUserEmail

  return {
    id: connection.id,
    userId: connection.userId,
    connectedUserId: connection.connectedUserId,
    connectedUserName,
    connectedUserEmail,
    status: connection.status,
    createdAt: connection.createdAt.toISOString(),
    updatedAt: connection.updatedAt.toISOString(),
  }
}

function serializeRequest(request: {
  id: string
  fromUserId: string
  toUserId: string
  fromUserName: string
  fromUserEmail: string
  status: string
  createdAt: Date
  updatedAt: Date
  toUserName?: string | null
  toUserEmail?: string | null
}) {
  return {
    id: request.id,
    fromUserId: request.fromUserId,
    toUserId: request.toUserId,
    fromUserName: request.fromUserName,
    fromUserEmail: request.fromUserEmail,
    toUserName: request.toUserName || null,
    toUserEmail: request.toUserEmail || null,
    status: request.status,
    createdAt: request.createdAt.toISOString(),
    updatedAt: request.updatedAt.toISOString(),
  }
}

async function getNotificationEmailSettings(userId: string) {
  const stored = await prisma.userNotificationSettings.findUnique({ where: { userId } })
  return stored ? { ...defaultNotificationSettings, ...stored } : defaultNotificationSettings
}

async function sendEmailViaRoute(req: NextRequest, mail: { to: string; subject: string; text?: string; html?: string; fromName?: string }) {
  await fetch(new URL("/api/send-email", req.url), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(mail),
  })
}

async function sendEmailIfAllowed(req: NextRequest, userId: string, settingKey: keyof NotificationSettings, mail: { to: string; subject: string; text?: string; html?: string; fromName?: string }) {
  const settings = await getNotificationEmailSettings(userId)
  if (!settings[settingKey]) {
    return false
  }

  await sendEmailViaRoute(req, mail)
  return true
}

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedDbUser(req)
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const view = req.nextUrl.searchParams.get("view") || "connections"

    if (view === "requests") {
      const incoming = await prisma.connectionRequest.findMany({
        where: {
          toUserId: authUser.dbUser.id,
          status: "pending",
        },
        orderBy: { updatedAt: "desc" },
      })

      const outgoing = await prisma.connectionRequest.findMany({
        where: {
          fromUserId: authUser.dbUser.id,
          status: "pending",
        },
        include: { toUser: true },
        orderBy: { updatedAt: "desc" },
      })

      // Map outgoing requests to include recipient info
      const outgoingSerialized = outgoing.map((r) =>
        serializeRequest({
          ...r,
          toUserName: r.toUser?.displayName || null,
          toUserEmail: r.toUser?.email || null,
        })
      )

      return NextResponse.json({
        incoming: incoming.map(serializeRequest),
        outgoing: outgoingSerialized,
      })
    }

    const connections = await prisma.socialConnection.findMany({
      where: {
        userId: authUser.dbUser.id,
        status: "accepted",
      },
      include: {
        connectedUser: {
          select: {
            displayName: true,
            email: true,
            photoUrl: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    })

    return NextResponse.json({
      connections: connections.map(serializeConnection),
    })
  } catch (error) {
    console.error("Connections load error:", error)
    return NextResponse.json({ error: "Failed to load connections" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedDbUser(req)
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const action = body.action as string | undefined

    if (action === "send") {
      const recipientEmail = String(body.recipientEmail || "").trim().toLowerCase()
      if (!recipientEmail) {
        return NextResponse.json({ error: "Missing recipientEmail" }, { status: 400 })
      }

      const recipient = await prisma.user.findUnique({ where: { email: recipientEmail } })
      if (!recipient) {
        return NextResponse.json({ error: "No user found for that email" }, { status: 404 })
      }

      if (recipient.id === authUser.dbUser.id) {
        return NextResponse.json({ error: "You cannot connect with yourself" }, { status: 400 })
      }

      const existingRequest = await prisma.connectionRequest.findUnique({
        where: {
          fromUserId_toUserId: {
            fromUserId: authUser.dbUser.id,
            toUserId: recipient.id,
          },
        },
      })

      if (existingRequest) {
        return NextResponse.json({ request: serializeRequest(existingRequest) }, { status: 200 })
      }

      const request = await prisma.connectionRequest.create({
        data: {
          fromUserId: authUser.dbUser.id,
          toUserId: recipient.id,
          fromUserName: authUser.dbUser.displayName || authUser.decodedToken.name || authUser.dbUser.email,
          fromUserEmail: authUser.dbUser.email,
          status: "pending",
        },
      })

      try {
        const outgoingEmail = buildConnectionRequestOutgoingEmail({
          fromName: request.fromUserName,
          fromEmail: request.fromUserEmail,
          toName: recipient.displayName,
        })
        const incomingEmail = buildConnectionRequestIncomingEmail({
          fromName: request.fromUserName,
          fromEmail: request.fromUserEmail,
          toName: recipient.displayName,
        })

        await Promise.all([
          sendEmailIfAllowed(req, authUser.dbUser.id, "emailConnectionsOutgoing", {
            to: authUser.dbUser.email,
            subject: outgoingEmail.subject,
            text: outgoingEmail.text,
            html: outgoingEmail.html,
            fromName: "Eventora",
          }),
          sendEmailIfAllowed(req, recipient.id, "emailConnectionsIncoming", {
            to: recipient.email,
            subject: incomingEmail.subject,
            text: incomingEmail.text,
            html: incomingEmail.html,
            fromName: "Eventora",
          }),
        ])
      } catch (emailError) {
        console.warn("Failed to send connection request email", emailError)
      }

      return NextResponse.json({ request: serializeRequest(request) }, { status: 201 })
    }

    if (action === "accept") {
      const requestId = String(body.requestId || "")
      if (!requestId) {
        return NextResponse.json({ error: "Missing requestId" }, { status: 400 })
      }

      const request = await prisma.connectionRequest.findUnique({ where: { id: requestId } })
      if (!request || request.toUserId !== authUser.dbUser.id) {
        return NextResponse.json({ error: "Request not found" }, { status: 404 })
      }

      const sender = await prisma.user.findUnique({ where: { id: request.fromUserId } })
      if (!sender) {
        return NextResponse.json({ error: "Sender not found" }, { status: 404 })
      }

      const acceptedAt = new Date()

      await prisma.$transaction([
        prisma.connectionRequest.update({
          where: { id: request.id },
          data: { status: "accepted" },
        }),
        prisma.socialConnection.upsert({
          where: {
            userId_connectedUserId: {
              userId: authUser.dbUser.id,
              connectedUserId: sender.id,
            },
          },
          create: {
            userId: authUser.dbUser.id,
            connectedUserId: sender.id,
            connectedUserName: sender.displayName || sender.email,
            connectedUserEmail: sender.email,
            status: "accepted",
            createdAt: acceptedAt,
            updatedAt: acceptedAt,
          },
          update: {
            connectedUserName: sender.displayName || sender.email,
            connectedUserEmail: sender.email,
            status: "accepted",
            updatedAt: acceptedAt,
          },
        }),
        prisma.socialConnection.upsert({
          where: {
            userId_connectedUserId: {
              userId: sender.id,
              connectedUserId: authUser.dbUser.id,
            },
          },
          create: {
            userId: sender.id,
            connectedUserId: authUser.dbUser.id,
            connectedUserName: authUser.dbUser.displayName || authUser.dbUser.email,
            connectedUserEmail: authUser.dbUser.email,
            status: "accepted",
            createdAt: acceptedAt,
            updatedAt: acceptedAt,
          },
          update: {
            connectedUserName: authUser.dbUser.displayName || authUser.dbUser.email,
            connectedUserEmail: authUser.dbUser.email,
            status: "accepted",
            updatedAt: acceptedAt,
          },
        }),
      ])

      try {
        const senderName = sender.displayName || sender.email
        const recipientName = authUser.dbUser.displayName || authUser.dbUser.email
        const senderAcceptedEmail = buildConnectionRequestAcceptedEmail({
          senderName,
          senderEmail: sender.email,
          recipientName,
          recipientEmail: authUser.dbUser.email,
          viewer: "sender",
        })
        const recipientAcceptedEmail = buildConnectionRequestAcceptedEmail({
          senderName,
          senderEmail: sender.email,
          recipientName,
          recipientEmail: authUser.dbUser.email,
          viewer: "recipient",
        })

        await Promise.all([
          sendEmailIfAllowed(req, authUser.dbUser.id, "emailConnectionsAccepted", {
            to: authUser.dbUser.email,
            subject: recipientAcceptedEmail.subject,
            text: recipientAcceptedEmail.text,
            html: recipientAcceptedEmail.html,
            fromName: "Eventora",
          }),
          sendEmailIfAllowed(req, sender.id, "emailConnectionsAccepted", {
            to: sender.email,
            subject: senderAcceptedEmail.subject,
            text: senderAcceptedEmail.text,
            html: senderAcceptedEmail.html,
            fromName: "Eventora",
          }),
        ])
      } catch (emailError) {
        console.warn("Failed to send connection accepted emails", emailError)
      }

      return NextResponse.json({ ok: true }, { status: 200 })
    }

    if (action === "reject") {
      const requestId = String(body.requestId || "")
      if (!requestId) {
        return NextResponse.json({ error: "Missing requestId" }, { status: 400 })
      }

      const request = await prisma.connectionRequest.findUnique({ where: { id: requestId } })
      if (!request || request.toUserId !== authUser.dbUser.id) {
        return NextResponse.json({ error: "Request not found" }, { status: 404 })
      }

      await prisma.connectionRequest.update({
        where: { id: requestId },
        data: { status: "rejected" },
      })

      return NextResponse.json({ ok: true }, { status: 200 })
    }

    if (action === "cancel") {
      const requestId = String(body.requestId || "")
      if (!requestId) {
        return NextResponse.json({ error: "Missing requestId" }, { status: 400 })
      }

      const request = await prisma.connectionRequest.findUnique({ where: { id: requestId } })
      if (!request || request.fromUserId !== authUser.dbUser.id) {
        return NextResponse.json({ error: "Request not found or not allowed" }, { status: 404 })
      }

      await prisma.connectionRequest.delete({ where: { id: requestId } })

      return NextResponse.json({ ok: true }, { status: 200 })
    }

    if (action === "block") {
      const connectedUserId = String(body.connectedUserId || "")
      const connectedUserName = String(body.connectedUserName || "")
      const connectedUserEmail = String(body.connectedUserEmail || "")

      if (!connectedUserId) {
        return NextResponse.json({ error: "Missing connectedUserId" }, { status: 400 })
      }

      await prisma.socialConnection.deleteMany({
        where: {
          userId: authUser.dbUser.id,
          connectedUserId,
        },
      })

      const blockedConnection = await prisma.socialConnection.upsert({
        where: {
          userId_connectedUserId: {
            userId: authUser.dbUser.id,
            connectedUserId,
          },
        },
        create: {
          userId: authUser.dbUser.id,
          connectedUserId,
          connectedUserName,
          connectedUserEmail,
          status: "blocked",
        },
        update: {
          connectedUserName,
          connectedUserEmail,
          status: "blocked",
        },
      })

      return NextResponse.json({ connection: serializeConnection(blockedConnection) }, { status: 200 })
    }

    if (action === "unblock") {
      const connectedUserId = String(body.connectedUserId || "")
      if (!connectedUserId) {
        return NextResponse.json({ error: "Missing connectedUserId" }, { status: 400 })
      }

      await prisma.socialConnection.deleteMany({
        where: {
          userId: authUser.dbUser.id,
          connectedUserId,
          status: "blocked",
        },
      })

      return NextResponse.json({ ok: true }, { status: 200 })
    }

    return NextResponse.json({ error: "Unsupported action" }, { status: 400 })
  } catch (error) {
    console.error("Connections mutation error:", error)
    return NextResponse.json({ error: "Failed to update connections" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedDbUser(req)
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const connectedUserId = String(body.connectedUserId || "")
    if (!connectedUserId) {
      return NextResponse.json({ error: "Missing connectedUserId" }, { status: 400 })
    }

    await prisma.socialConnection.deleteMany({
      where: {
        userId: authUser.dbUser.id,
        connectedUserId,
      },
    })

    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (error) {
    console.error("Connection delete error:", error)
    return NextResponse.json({ error: "Failed to remove connection" }, { status: 500 })
  }
}