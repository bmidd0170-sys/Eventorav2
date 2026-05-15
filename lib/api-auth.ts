import type { User } from "@prisma/client"
import { NextRequest } from "next/server"
import { jwtDecode } from "jwt-decode"
import { prisma } from "@/lib/prisma"

type DecodedToken = {
  sub?: string
  email?: string
  name?: string
  picture?: string
}

async function getOrCreateDbUser(decodedToken: DecodedToken): Promise<User | null> {
  const firebaseUid = decodedToken.sub
  if (!firebaseUid) {
    return null
  }

  const existingByUid = await prisma.user.findUnique({ where: { firebaseUid } })
  if (existingByUid) {
    return existingByUid
  }

  const userEmail = decodedToken.email || `user+${firebaseUid}@example.com`

  try {
    return await prisma.user.create({
      data: {
        firebaseUid,
        email: userEmail,
        displayName: decodedToken.name || "User",
        photoUrl: decodedToken.picture,
      },
    })
  } catch (createError: any) {
    if (createError.code !== "P2002") {
      throw createError
    }

    const existingByEmail = await prisma.user.findUnique({ where: { email: userEmail } })
    if (existingByEmail) {
      if (!existingByEmail.firebaseUid) {
        return prisma.user.update({
          where: { email: userEmail },
          data: { firebaseUid },
        })
      }

      return existingByEmail
    }

    return prisma.user.findUnique({ where: { firebaseUid } })
  }
}

export async function getAuthenticatedDbUser(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  if (!authHeader?.startsWith("Bearer ")) {
    return null
  }

  const token = authHeader.slice(7)
  let decodedToken: DecodedToken
  try {
    decodedToken = jwtDecode(token) as DecodedToken
  } catch {
    return null
  }

  const dbUser = await getOrCreateDbUser(decodedToken)
  if (!dbUser) {
    return null
  }

  return {
    dbUser,
    decodedToken,
    firebaseUid: decodedToken.sub as string,
  }
}