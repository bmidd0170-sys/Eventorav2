import { NextRequest, NextResponse } from "next/server"
import { getAuthenticatedDbUser, getOwnedEvent } from "@/lib/auth/server"
import { badRequest, forbidden, internalServerError, unauthorized } from "@/lib/api/responses"
import { ok } from "@/lib/api/success"

type LoadRequest = {
  eventId: string
  userId: string
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await getAuthenticatedDbUser(req)
    if (!authResult) {
      return unauthorized()
    }

    const { firebaseUid, dbUser } = authResult

    const body = (await req.json()) as LoadRequest

    if (!body.eventId || !body.userId) {
      return badRequest("Missing required fields")
    }

    // Verify the token matches the provided user ID
    if (firebaseUid !== body.userId) {
      return forbidden("Unauthorized")
    }

    const eventResult = await getOwnedEvent(body.eventId, dbUser.id, {
      select: {
        id: true,
        title: true,
        description: true,
        pagesData: true,
        status: true,
        updatedAt: true,
      },
      forbiddenMessage: "Unauthorized",
      onNotFound: () =>
        NextResponse.json(
          {
            success: true,
            event: {
              id: body.eventId,
              title: "Untitled Event",
              description: "",
              status: "draft",
              pages: [],
              messages: [],
              updatedAt: new Date(),
            },
          },
          { status: 200 }
        ),
    })

    if (eventResult.response) {
      return eventResult.response
    }

    const event = eventResult.event

    // pagesData may be an array (legacy) or an object { pages, messages }
    let pages = [] as any
    let messages = [] as any
    if (Array.isArray(event.pagesData)) {
      pages = event.pagesData
    } else if (event.pagesData && typeof event.pagesData === 'object') {
      pages = (event.pagesData as any).pages ?? []
      messages = (event.pagesData as any).messages ?? []
    }

    return ok({
      success: true,
      event: {
        id: event.id,
        title: event.title,
        description: event.description,
        status: event.status,
        pages: pages,
        messages: messages,
        updatedAt: event.updatedAt,
      },
    })
  } catch (error) {
    console.error("Load error:", error)
    return internalServerError("Failed to load invitation")
  }
}
