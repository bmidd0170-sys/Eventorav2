import { NextRequest, NextResponse } from 'next/server'
import type { Prisma } from '@prisma/client'
import { getAuthenticatedDbUser } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'

async function tableExists(tx: Prisma.TransactionClient, tableName: string) {
  const result = await tx.$queryRaw<Array<{ exists: boolean }>>`
    SELECT to_regclass(${tableName}) IS NOT NULL AS "exists"
  `
  return result[0]?.exists ?? false
}

export async function POST(req: NextRequest) {
  const auth = await getAuthenticatedDbUser(req)
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { firebaseUid } = auth

  try {
    // Check if the user exists first. If the DB record is already gone, treat as success.
    const existing = await prisma.user.findUnique({ where: { firebaseUid } })
    if (!existing) {
      console.warn(`User with firebaseUid=${firebaseUid} not found in DB; treating as deleted`)
      return NextResponse.json({ success: true })
    }

    // Remove all user-owned records explicitly so deletion is complete even when
    // relations are nullable or not modeled as database cascades.
    await prisma.$transaction(async (tx) => {
      const hasConnection = await tableExists(tx, 'public."Connection"')
      const hasConnectionRequest = await tableExists(tx, 'public."ConnectionRequest"')
      const hasSocialConnection = await tableExists(tx, 'public."SocialConnection"')
      const hasNotificationSettings = await tableExists(tx, 'public."UserNotificationSettings"')
      const hasInvitation = await tableExists(tx, 'public."Invitation"')
      const hasEventSettings = await tableExists(tx, 'public."EventSettings"')
      const hasGuestListEntry = await tableExists(tx, 'public."GuestListEntry"')
      const hasGuestList = await tableExists(tx, 'public."GuestList"')
      const hasEvent = await tableExists(tx, 'public."Event"')
      const hasUser = await tableExists(tx, 'public."User"')

      const eventRows = await tx.event.findMany({
        where: { userId: existing.id },
        select: { id: true },
      })
      const eventIds = eventRows.map((event) => event.id)

      const guestListRows = await tx.guestList.findMany({
        where: { userId: existing.id },
        select: { id: true },
      })
      const guestListIds = guestListRows.map((guestList) => guestList.id)

      const steps = [
        ['connection.deleteMany', () => hasConnection ? tx.connection.deleteMany({ where: { userId: firebaseUid } }) : Promise.resolve({ count: 0 })],
        ['connectionRequest.deleteMany', () => hasConnectionRequest ? tx.connectionRequest.deleteMany({ where: { OR: [{ fromUserId: existing.id }, { toUserId: existing.id }] } }) : Promise.resolve({ count: 0 })],
        ['socialConnection.deleteMany', () => hasSocialConnection ? tx.socialConnection.deleteMany({ where: { OR: [{ userId: existing.id }, { connectedUserId: existing.id }] } }) : Promise.resolve({ count: 0 })],
        ['userNotificationSettings.deleteMany', () => hasNotificationSettings ? tx.userNotificationSettings.deleteMany({ where: { userId: existing.id } }) : Promise.resolve({ count: 0 })],
        ['invitation.deleteMany(by user)', () => hasInvitation ? tx.invitation.deleteMany({ where: { userId: existing.id } }) : Promise.resolve({ count: 0 })],
        ['invitation.deleteMany(by event ids)', () => hasInvitation && eventIds.length ? tx.invitation.deleteMany({ where: { eventId: { in: eventIds } } }) : Promise.resolve({ count: 0 })],
        ['eventSettings.deleteMany', () => hasEventSettings && eventIds.length ? tx.eventSettings.deleteMany({ where: { eventId: { in: eventIds } } }) : Promise.resolve({ count: 0 })],
        ['guestListEntry.deleteMany', () => hasGuestListEntry && guestListIds.length ? tx.guestListEntry.deleteMany({ where: { guestListId: { in: guestListIds } } }) : Promise.resolve({ count: 0 })],
        ['guestList.deleteMany', () => hasGuestList && guestListIds.length ? tx.guestList.deleteMany({ where: { id: { in: guestListIds } } }) : Promise.resolve({ count: 0 })],
        ['event.deleteMany', () => hasEvent && eventIds.length ? tx.event.deleteMany({ where: { id: { in: eventIds } } }) : Promise.resolve({ count: 0 })],
        ['user.delete', () => hasUser ? tx.user.delete({ where: { id: existing.id } }) : Promise.resolve({ count: 0 })],
      ] as const

      for (const [stepName, step] of steps) {
        try {
          await step()
        } catch (stepError) {
          console.error(`Account deletion failed at ${stepName} for firebaseUid=${firebaseUid}`, stepError)
          throw stepError
        }
      }
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    // Log detailed error for debugging and return a generic error payload.
    console.error('Failed to delete user in DB', err)
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
  }
}
