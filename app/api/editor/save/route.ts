import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { jwtDecode } from "jwt-decode"

type SaveRequest = {
  invitationId: string
  pages: unknown[]
  userId: string
  messages?: unknown[]
  title?: string
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

    const body = (await req.json()) as SaveRequest

    if (!body.invitationId || !body.pages || !body.userId) {
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

    // Get or create the user in database using Firebase UID
    // The userId in the body is the Firebase UID from the JWT token
    const firebaseUid = decodedToken.sub
    let dbUser = await prisma.user.findUnique({
      where: { firebaseUid }
    })

    // If user doesn't exist, create them with minimal info
    if (!dbUser) {
      const userEmail = decodedToken.email || `user+${firebaseUid}@example.com`
      try {
        dbUser = await prisma.user.create({
          data: {
            firebaseUid,
            email: userEmail,
            displayName: decodedToken.name || "User"
          }
        })
      } catch (createError: any) {
        // If unique constraint violation on email, find existing user by email and update firebaseUid
        if (createError.code === 'P2002' && createError.meta?.target?.includes('email')) {
          dbUser = await prisma.user.findUnique({
            where: { email: userEmail }
          })
          if (dbUser && !dbUser.firebaseUid) {
            // Update the existing user with the new Firebase UID
            dbUser = await prisma.user.update({
              where: { email: userEmail },
              data: { firebaseUid }
            })
          }
        } else {
          throw createError
        }
      }
    }

    // Create or update the event with upsert using database user ID
    // Store pages and messages together in pagesData as an object
    // Transform pages to include 'type' field extracted from id
    const transformedPages = (body.pages as any[]).map((page: any) => {
      // Extract page type from id (format: "type-timestamp")
      const pageType = typeof page.id === 'string' ? page.id.split('-')[0] : 'cover'
      return {
        ...page,
        type: pageType,
        // Ensure content is an object
        content: page.content || {}
      }
    })
    const pagesData = { pages: transformedPages, messages: body.messages ?? [] } as any
    const titleToSave = (body.title && typeof body.title === 'string') ? body.title : "Untitled Event"
    const updatedEvent = await prisma.event.upsert({
      where: { id: body.invitationId },
      create: {
        id: body.invitationId,
        userId: dbUser.id, // Use database User ID, not Firebase UID
        title: titleToSave,
        startDate: new Date(),
        endDate: new Date(Date.now() + 86400000),
        pagesData: pagesData as any,
        status: "draft"
      },
      update: {
        title: titleToSave,
        pagesData: pagesData as any,
        status: "draft",
        updatedAt: new Date()
      }
    })

    return NextResponse.json(
      {
        success: true,
        message: "Invitation saved as draft",
        invitationId: body.invitationId,
        updatedAt: updatedEvent.updatedAt,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Save error:", error)
    return NextResponse.json(
      { error: "Failed to save invitation" },
      { status: 500 }
    )
  }
}
