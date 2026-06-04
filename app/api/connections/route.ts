import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getAuthenticatedDbUser } from "@/lib/auth/server"
import { defaultNotificationSettings, type NotificationSettings } from "@/lib/notification-settings"
import { sendEmail } from "@/lib/email"
import { badRequest, conflict, forbidden, internalServerError, notFound, unauthorized } from "@/lib/api/responses"
import { created, ok } from "@/lib/api/success"

function serializeConnection(connection: {
  id: string
  userId: string
  connectedUserId: string
  connectedUserName: string
  connectedUserEmail: string
  status: string
  createdAt: Date
  updatedAt: Date
}) {
  return {
    id: connection.id,
    userId: connection.userId,
    connectedUserId: connection.connectedUserId,
    connectedUserName: connection.connectedUserName,
    connectedUserEmail: connection.connectedUserEmail,
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
  toUserName?: string | null
  toUserEmail?: string | null
  status: string
  createdAt: Date
  updatedAt: Date
}) {
  return {
    id: request.id,
    fromUserId: request.fromUserId,
    toUserId: request.toUserId,
    fromUserName: request.fromUserName,
    fromUserEmail: request.fromUserEmail,
    toUserName: request.toUserName ?? null,
    toUserEmail: request.toUserEmail ?? null,
    status: request.status,
    createdAt: request.createdAt.toISOString(),
    updatedAt: request.updatedAt.toISOString(),
  }
}

async function hasBlockingConnection(userAId: string, userBId: string) {
  return prisma.socialConnection.findFirst({
    where: {
      status: "blocked",
      OR: [
        {
          userId: userAId,
          connectedUserId: userBId,
        },
        {
          userId: userBId,
          connectedUserId: userAId,
        },
      ],
    },
    select: { id: true },
  })
}

async function removeRelationshipBetweenUsers(userAId: string, userBId: string) {
  await prisma.$transaction([
    prisma.socialConnection.deleteMany({
      where: {
        status: "accepted",
        OR: [
          {
            userId: userAId,
            connectedUserId: userBId,
          },
          {
            userId: userBId,
            connectedUserId: userAId,
          },
        ],
      },
    }),
    prisma.connectionRequest.deleteMany({
      where: {
        OR: [
          {
            fromUserId: userAId,
            toUserId: userBId,
          },
          {
            fromUserId: userBId,
            toUserId: userAId,
          },
        ],
      },
    }),
  ])
}

async function getNotificationEmailSettings(userId: string) {
  const stored = await prisma.userNotificationSettings.findUnique({ where: { userId } })
  return stored ? { ...defaultNotificationSettings, ...stored } : defaultNotificationSettings
}

async function sendEmailIfAllowed(userId: string, settingKey: keyof NotificationSettings, mail: { to: string; subject: string; text?: string; html?: string; fromName?: string }) {
  const settings = await getNotificationEmailSettings(userId)
  if (!settings[settingKey]) {
    return false
  }

  await sendEmail(mail)
  return true
}

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedDbUser(req)
    if (!authUser) {
      return unauthorized()
    }

    const view = req.nextUrl.searchParams.get("view") || "connections"

    if (view === "requests") {
      const requests = await prisma.connectionRequest.findMany({
        where: {
          toUserId: authUser.dbUser.id,
          status: "pending",
        },
        orderBy: { updatedAt: "desc" },
      })

      return ok({
        requests: requests.map(serializeRequest),
      })
    }

    if (view === "outgoing-requests") {
      const requests = await prisma.connectionRequest.findMany({
        where: { fromUserId: authUser.dbUser.id, status: "pending" },
        include: { toUser: { select: { displayName: true, email: true } } },
        orderBy: { updatedAt: "desc" },
      })

      return ok({
        requests: requests.map((request) =>
          serializeRequest({
            ...request,
            toUserName: request.toUser?.displayName || request.toUser?.email || null,
            toUserEmail: request.toUser?.email ?? null,
          })
        ),
      })
    }

    const connections = await prisma.socialConnection.findMany({
      where: {
        userId: authUser.dbUser.id,
        status: "accepted",
      },
      orderBy: { updatedAt: "desc" },
    })

    return ok({
      connections: connections.map(serializeConnection),
    })
  } catch (error) {
    console.error("Connections load error:", error)
    return internalServerError("Failed to load connections")
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedDbUser(req)
    if (!authUser) {
      return unauthorized()
    }

    const body = await req.json()
    const action = body.action as string | undefined

    if (action === "send") {
      const recipientEmail = String(body.recipientEmail || "").trim().toLowerCase()
      if (!recipientEmail) {
        return badRequest("Missing recipientEmail")
      }

      const recipient = await prisma.user.findUnique({ where: { email: recipientEmail } })
      if (!recipient) {
        return notFound("No user found for that email")
      }

      if (recipient.id === authUser.dbUser.id) {
        return badRequest("You cannot connect with yourself")
      }

      if (await hasBlockingConnection(authUser.dbUser.id, recipient.id)) {
        return forbidden("You cannot send a request to this user")
      }

      const acceptedConnection = await prisma.socialConnection.findFirst({
        where: {
          status: "accepted",
          OR: [
            {
              userId: authUser.dbUser.id,
              connectedUserId: recipient.id,
            },
            {
              userId: recipient.id,
              connectedUserId: authUser.dbUser.id,
            },
          ],
        },
        select: { id: true },
      })

      if (acceptedConnection) {
        return conflict("You are already connected with this user")
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
        return ok({ request: serializeRequest(existingRequest) })
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
        await sendEmailIfAllowed(recipient.id, "emailConnectionsRequests", {
          to: recipient.email,
          subject: `${request.fromUserName} sent you a connection request on Invyra`,
          text: `${request.fromUserName} (${request.fromUserEmail}) wants to connect with you on Invyra.`,
          html: `<p><strong>${request.fromUserName}</strong> (${request.fromUserEmail}) wants to connect with you on <strong>Invyra</strong>.</p>`,
          fromName: "Invyra",
        })
      } catch (emailError) {
        console.warn("Failed to send connection request email", emailError)
      }

      return created({ request: serializeRequest(request) })
    }

    if (action === "accept") {
      const requestId = String(body.requestId || "")
      if (!requestId) {
        return badRequest("Missing requestId")
      }

      const request = await prisma.connectionRequest.findUnique({ where: { id: requestId } })
      if (!request || request.toUserId !== authUser.dbUser.id) {
        return notFound("Request not found")
      }

      if (await hasBlockingConnection(authUser.dbUser.id, request.fromUserId)) {
        return forbidden("This request can no longer be accepted")
      }

      const sender = await prisma.user.findUnique({ where: { id: request.fromUserId } })
      if (!sender) {
        return notFound("Sender not found")
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
        await Promise.all([
          sendEmailIfAllowed(authUser.dbUser.id, "emailConnectionsAccepted", {
            to: authUser.dbUser.email,
            subject: `You accepted ${sender.displayName || sender.email}'s connection request`,
            text: `You accepted ${sender.displayName || sender.email}'s connection request on Invyra.`,
            html: `<p>You accepted <strong>${sender.displayName || sender.email}</strong>'s connection request on <strong>Invyra</strong>.</p>`,
            fromName: "Invyra",
          }),
          sendEmailIfAllowed(sender.id, "emailConnectionsAccepted", {
            to: sender.email,
            subject: `${authUser.dbUser.displayName || authUser.dbUser.email} accepted your connection request`,
            text: `${authUser.dbUser.displayName || authUser.dbUser.email} accepted your connection request on Invyra.`,
            html: `<p><strong>${authUser.dbUser.displayName || authUser.dbUser.email}</strong> accepted your connection request on <strong>Invyra</strong>.</p>`,
            fromName: "Invyra",
          }),
        ])
      } catch (emailError) {
        console.warn("Failed to send connection accepted emails", emailError)
      }

      return ok({ ok: true })
    }

    if (action === "reject") {
      const requestId = String(body.requestId || "")
      if (!requestId) {
        return badRequest("Missing requestId")
      }

      const request = await prisma.connectionRequest.findUnique({ where: { id: requestId } })
      if (!request || request.toUserId !== authUser.dbUser.id) {
        return notFound("Request not found")
      }

      await prisma.connectionRequest.update({
        where: { id: requestId },
        data: { status: "rejected" },
      })

      return ok({ ok: true })
    }

    if (action === "block") {
      const connectedUserId = String(body.connectedUserId || "")
      const connectedUserName = String(body.connectedUserName || "")
      const connectedUserEmail = String(body.connectedUserEmail || "")

      if (!connectedUserId) {
        return badRequest("Missing connectedUserId")
      }

      await removeRelationshipBetweenUsers(authUser.dbUser.id, connectedUserId)

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

      return ok({ connection: serializeConnection(blockedConnection) })
    }

    if (action === "unblock") {
      const connectedUserId = String(body.connectedUserId || "")
      if (!connectedUserId) {
        return badRequest("Missing connectedUserId")
      }

      await prisma.socialConnection.deleteMany({
        where: {
          userId: authUser.dbUser.id,
          connectedUserId,
          status: "blocked",
        },
      })

      return ok({ ok: true })
    }

    return badRequest("Unsupported action")
  } catch (error) {
    console.error("Connections mutation error:", error)
    return internalServerError("Failed to update connections")
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedDbUser(req)
    if (!authUser) {
      return unauthorized()
    }

    const body = await req.json()
    const connectedUserId = String(body.connectedUserId || "")
    if (!connectedUserId) {
      return badRequest("Missing connectedUserId")
    }

    await removeRelationshipBetweenUsers(authUser.dbUser.id, connectedUserId)

    return ok({ ok: true })
  } catch (error) {
    console.error("Connection delete error:", error)
    return internalServerError("Failed to remove connection")
  }
}