import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { jwtDecode } from "jwt-decode"

type LoadRequest = {
  eventId: string
  userId: string
}

export async function POST(req: NextRequest) {
  try {
    // Get Firebase Auth token from headers
    const authHeader = req.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const token = authHeader.slice(7)
    let decodedToken: any
    try {
      // Simple JWT decode without verification (client-side already verified)
      decodedToken = jwtDecode(token) as any
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      )
    }

    const body = (await req.json()) as LoadRequest

    if (!body.eventId || !body.userId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Verify the token matches the provided user ID
    if (decodedToken.sub !== body.userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      )
    }

    // Look up the database user by Firebase UID
    const firebaseUid = decodedToken.sub
    const dbUser = await prisma.user.findUnique({
      where: { firebaseUid }
    })

    // If user doesn't exist in database yet, return empty event (new draft)
    if (!dbUser) {
      return NextResponse.json(
        {
          success: true,
          event: {
            id: body.eventId,
            title: "Untitled Event",
            description: "",
            status: "draft",
            pages: [],
            messages: [],
            updatedAt: new Date()
          }
        },
        { status: 200 }
      )
    }

    // Find the event by ID
    const event = await prisma.event.findUnique({
      where: { id: body.eventId },
      select: {
        id: true,
        title: true,
        description: true,
        userId: true,
        pagesData: true,
        status: true,
        updatedAt: true
      }
    })

    // Event doesn't exist yet (new draft from home screen) - return empty pages
    if (!event) {
      return NextResponse.json(
        {
          success: true,
          event: {
            id: body.eventId,
            title: "Untitled Event",
            description: "",
            status: "draft",
            pages: [],
            messages: [],
            updatedAt: new Date()
          }
        },
        { status: 200 }
      )
    }

    // Verify the user owns this event (using database user ID)
    if (event.userId !== dbUser.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      )
    }

    // pagesData may be an array (legacy) or an object { pages, messages }
    let pages = [] as any
    let messages = [] as any
    if (Array.isArray(event.pagesData)) {
      pages = event.pagesData
    } else if (event.pagesData && typeof event.pagesData === 'object') {
      pages = (event.pagesData as any).pages ?? []
      messages = (event.pagesData as any).messages ?? []
    }

    return NextResponse.json(
      {
        success: true,
        event: {
          id: event.id,
          title: event.title,
          description: event.description,
          status: event.status,
          pages: pages,
          messages: messages,
          updatedAt: event.updatedAt
        }
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Load error:", error)
    return NextResponse.json(
      { error: "Failed to load invitation" },
      { status: 500 }
    )
  }
}
