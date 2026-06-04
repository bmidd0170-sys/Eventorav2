import { NextResponse } from "next/server"

import { prisma } from "@/lib/db"
import { forbidden, notFound } from "@/lib/api/responses"

type OwnershipOptions = {
  select?: Record<string, unknown>
  forbiddenMessage?: string
  notFoundMessage?: string
  onNotFound?: () => NextResponse
}

export async function getOwnedEvent(
  eventId: string,
  ownerUserId: string,
  options?: OwnershipOptions
) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      ...(options?.select ?? {}),
      userId: true,
    },
  })

  if (!event) {
    if (options?.onNotFound) {
      return { response: options.onNotFound() }
    }

    return {
      response: notFound(options?.notFoundMessage ?? "Event not found"),
    }
  }

  if (event.userId !== ownerUserId) {
    return {
      response: forbidden(options?.forbiddenMessage ?? "Forbidden"),
    }
  }

  return { event }
}
