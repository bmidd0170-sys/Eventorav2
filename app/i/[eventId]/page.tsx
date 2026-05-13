import { notFound } from "next/navigation"
import { Prisma } from "@prisma/client"

import { prisma } from "@/lib/prisma"
import { PublicInvitationView } from "./public-invitation-view"

type InvitationPage = {
  id: string
  type: string
  content: Record<string, unknown>
}

type EventPagesPayload = Prisma.JsonValue | null | undefined

function isInvitationPage(value: unknown): value is InvitationPage {
  if (!value || typeof value !== "object") {
    return false
  }

  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.id === "string" &&
    typeof candidate.type === "string" &&
    candidate.content !== null &&
    typeof candidate.content === "object"
  )
}

function normalizePages(payload: EventPagesPayload): InvitationPage[] {
  const pagesSource = Array.isArray(payload)
    ? payload
    : payload && typeof payload === "object" && "pages" in payload
      ? (payload as { pages?: unknown }).pages
      : undefined

  if (!Array.isArray(pagesSource)) {
    return []
  }

  return pagesSource.filter(isInvitationPage)
}

function fallbackPages(title: string, startDate: Date): InvitationPage[] {
  const dateString = startDate.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  })
  const timeString = startDate.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  })

  return [
    {
      id: "cover",
      type: "cover",
      content: {
        headline: "You're Invited",
        subheadline: title,
      },
    },
    {
      id: "details",
      type: "details",
      content: {
        headline: "Event Details",
        date: dateString,
        time: timeString,
      },
    },
  ]
}

export default async function SharedInvitationPage({
  params,
}: {
  params: Promise<{ eventId: string }>
}) {
  const { eventId } = await params

  const event = await prisma.event.findFirst({
    where: {
      id: eventId,
      status: "published",
    },
    select: {
      id: true,
      title: true,
      pagesData: true,
      startDate: true,
    },
  })

  if (!event) {
    notFound()
  }

  const pages = normalizePages(event.pagesData)
  const safePages = pages.length > 0 ? pages : fallbackPages(event.title, event.startDate)

  return <PublicInvitationView title={event.title} pages={safePages} />
}
