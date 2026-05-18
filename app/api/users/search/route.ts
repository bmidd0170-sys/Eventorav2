import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthenticatedDbUser } from "@/lib/api-auth"

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedDbUser(req)
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const query = req.nextUrl.searchParams.get("q")?.trim() ?? ""
    if (!query) {
      return NextResponse.json({ users: [] }, { status: 200 })
    }

    const users = await prisma.user.findMany({
      where: {
        id: { not: authUser.dbUser.id },
        OR: [
          {
            displayName: {
              contains: query,
              mode: "insensitive",
            },
          },
          {
            email: {
              contains: query,
              mode: "insensitive",
            },
          },
        ],
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        photoUrl: true,
      },
      orderBy: [
        { displayName: "asc" },
        { email: "asc" },
      ],
      take: 12,
    })

    return NextResponse.json({
      users: users.map((user) => ({
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        photoUrl: user.photoUrl,
      })),
    }, { status: 200 })
  } catch (error) {
    console.error("User search error:", error)
    return NextResponse.json({ error: "Failed to search users" }, { status: 500 })
  }
}