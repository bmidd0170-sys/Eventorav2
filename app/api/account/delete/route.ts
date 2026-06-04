import { NextRequest, NextResponse } from 'next/server'
import type { Prisma } from '@prisma/client'
import { getAuthenticatedDbUser } from '@/lib/auth/server'
import { deleteFirebaseAuthUser } from '@/lib/auth/server'
import { prisma } from '@/lib/db'
import { internalServerError, unauthorized } from '@/lib/api/responses'
import { ok } from '@/lib/api/success'

async function tableExists(tx: Prisma.TransactionClient, tableName: string) {
  const result = await tx.$queryRaw<Array<{ exists: boolean }>>`
    SELECT to_regclass(${tableName}) IS NOT NULL AS "exists"
  `
  return result[0]?.exists ?? false
}

export async function POST(req: NextRequest) {
  const auth = await getAuthenticatedDbUser(req)
  if (!auth) {
    return unauthorized()
  }

  const { firebaseUid } = auth

  try {
    const existing = await prisma.user.findUnique({ where: { firebaseUid } })

    if (existing) {
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
    } else {
      console.warn(`User with firebaseUid=${firebaseUid} not found in DB; continuing with Firebase cleanup`)
    }

    const firebaseDeletion = await deleteFirebaseAuthUser(firebaseUid)

    return ok({
      success: true,
      firebaseAuthDeletionSkipped: firebaseDeletion.skipped ?? false,
    })
  } catch (err) {
    console.error('Failed to fully delete user', err)
    return internalServerError('Failed to delete user')
  }
}
