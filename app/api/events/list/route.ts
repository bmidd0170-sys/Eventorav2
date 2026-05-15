import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { jwtDecode } from "jwt-decode"

async function getOrCreateDbUser(decodedToken: any) {
  const firebaseUid = decodedToken.sub
  if (!firebaseUid) {
    return null
  }

  let dbUser = await prisma.user.findUnique({ where: { firebaseUid } })
  if (dbUser) {
    return dbUser
  }

  const userEmail = decodedToken.email || `user+${firebaseUid}@example.com`

  const findExistingUser = async () => {
    const existingByUid = await prisma.user.findUnique({ where: { firebaseUid } })
    if (existingByUid) {
      return existingByUid
    }

    const existingByEmail = await prisma.user.findUnique({ where: { email: userEmail } })
    if (existingByEmail) {
      if (existingByEmail.firebaseUid) {
        return existingByEmail
      }

      return prisma.user.update({
        where: { email: userEmail },
        data: { firebaseUid },
      })
    }

    return null
  }

  try {
    return await prisma.user.create({
      data: {
        firebaseUid,
        email: userEmail,
        displayName: decodedToken.name || "User",
      },
    })
  } catch (createError: any) {
    if (createError.code === "P2002") {
      const existingUser = await findExistingUser()
      if (existingUser) {
        return existingUser
      }

      return null
    }

    throw createError
  }
}

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

    const dbUser = await getOrCreateDbUser(decodedToken)
    if (!dbUser) {
      return NextResponse.json({ events: [] }, { status: 200 })
    }

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

    return NextResponse.json({ events: mapped }, { status: 200 })
  } catch (error) {
    console.error("Events list error:", error)
    return NextResponse.json({ error: "Failed to list events" }, { status: 500 })
  }
}
