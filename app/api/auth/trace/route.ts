import { NextRequest, NextResponse } from "next/server"
import { getAuthenticatedDbUser } from "@/lib/auth/server"
import { hasFirebaseAdminCredentials } from "@/lib/auth/server"

export const runtime = "nodejs"

export async function GET(req: NextRequest) {
  try {
    const authResult = await getAuthenticatedDbUser(req)

    if (!authResult) {
      return NextResponse.json(
        {
          authenticated: false,
          reason: "Missing or invalid bearer token",
          adminVerificationEnabled: hasFirebaseAdminCredentials(),
        },
        { status: 401 }
      )
    }

    return NextResponse.json(
      {
        authenticated: true,
        adminVerificationEnabled: hasFirebaseAdminCredentials(),
        firebaseUid: authResult.firebaseUid,
        token: {
          email: authResult.decodedToken.email ?? null,
          name: authResult.decodedToken.name ?? null,
        },
        dbUser: {
          id: authResult.dbUser.id,
          email: authResult.dbUser.email,
          firebaseUid: authResult.dbUser.firebaseUid,
          displayName: authResult.dbUser.displayName,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Auth trace error:", error)
    return NextResponse.json(
      {
        authenticated: false,
        reason: "Authentication service unavailable",
        adminVerificationEnabled: hasFirebaseAdminCredentials(),
      },
      { status: 500 }
    )
  }
}
