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

        const blockedConnections = await prisma.socialConnection.findMany({
            where: {
                status: "blocked",
                OR: [
                    { userId: authUser.dbUser.id },
                    { connectedUserId: authUser.dbUser.id },
                ],
            },
            select: {
                userId: true,
                connectedUserId: true,
            },
        })

        const blockedUserIds = new Set<string>()
        for (const connection of blockedConnections) {
            if (connection.userId === authUser.dbUser.id) {
                blockedUserIds.add(connection.connectedUserId)
            }

            if (connection.connectedUserId === authUser.dbUser.id) {
                blockedUserIds.add(connection.userId)
            }
        }

        const users = await prisma.user.findMany({
            where: {
                id: {
                    notIn: [authUser.dbUser.id, ...blockedUserIds],
                },
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