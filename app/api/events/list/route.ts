import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getAuthenticatedDbUser } from "@/lib/auth/server"
import { internalServerError, unauthorized } from "@/lib/api/responses"
import { ok } from "@/lib/api/success"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  try {
    const authResult = await getAuthenticatedDbUser(req)
    if (!authResult) {
      return unauthorized()
    }

    const { dbUser } = authResult

    const events = await prisma.event.findMany({
      where: { userId: dbUser.id },
      select: {
        id: true,
        title: true,
        description: true,
        startDate: true,
        endDate: true,
        status: true,
        pagesData: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: "desc" }
    })

    const mapped = events.map(e => ({
      id: e.id,
      title: e.title,
      description: e.description || "",
      date: new Date(e.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      time: new Date(e.startDate).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }),
      color: "from-primary/30 via-primary/10 to-transparent",
      status: e.status === 'published' ? 'active' : 'draft',
      guests: { confirmed: 0, total: 0 },
      reminder: false,
      updatedAt: e.updatedAt.toISOString(),
    }))

    return ok({ events: mapped })
  } catch (error) {
    console.error("Events list error:", error)
    return internalServerError("Failed to list events")
  }
}
