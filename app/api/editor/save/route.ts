import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getAuthenticatedDbUser } from "@/lib/auth/server"
import type { BrandSettings } from "@/lib/branding"
import { badRequest, forbidden, internalServerError, unauthorized } from "@/lib/api/responses"
import { ok } from "@/lib/api/success"

type SaveRequest = {
  invitationId: string
  pages: unknown[]
  userId: string
  messages?: unknown[]
  title?: string
  brand?: BrandSettings | null
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await getAuthenticatedDbUser(req)
    if (!authResult) {
      return unauthorized()
    }

    const { firebaseUid, dbUser } = authResult

    const body = (await req.json()) as SaveRequest

    if (!body.invitationId || !body.pages || !body.userId) {
      return badRequest("Missing required fields")
    }

    // Verify the token matches the provided user ID
    if (firebaseUid !== body.userId) {
      return forbidden("Unauthorized")
    }

    const existingEvent = await prisma.event.findUnique({
      where: { id: body.invitationId },
      select: { pagesData: true, status: true },
    })

    const existingBrand =
      existingEvent && !Array.isArray(existingEvent.pagesData) && existingEvent.pagesData && typeof existingEvent.pagesData === "object"
        ? ((existingEvent.pagesData as { brand?: BrandSettings | null }).brand ?? null)
        : null

    const brandToSave = body.brand ?? existingBrand

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
    const pagesData = {
      pages: transformedPages,
      messages: body.messages ?? [],
      brand: brandToSave,
    } as any
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
        status: existingEvent?.status ?? "draft",
        updatedAt: new Date()
      }
    })

    return ok({
      success: true,
      message: "Invitation saved as draft",
      invitationId: body.invitationId,
      updatedAt: updatedEvent.updatedAt,
    })
  } catch (error) {
    console.error("Save error:", error)
    return internalServerError("Failed to save invitation")
  }
}
