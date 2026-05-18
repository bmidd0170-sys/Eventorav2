"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { InvitationPageRenderer } from "@/components/invitation/invitation-page-renderer"
import { ChevronLeft, ChevronRight } from "lucide-react"

type InvitationPage = {
  id: string
  type: string
  content: Record<string, unknown>
}

export function PublicInvitationView({
  eventId,
  title,
  pages,
}: {
  eventId: string
  title: string
  pages: InvitationPage[]
}) {
  const [currentPageIndex, setCurrentPageIndex] = useState(0)
  const [rsvpResponse, setRsvpResponse] = useState<"attending" | "not-attending" | null>(null)

  const totalPages = pages.length
  const currentPage = pages[currentPageIndex]

  const subtitle = useMemo(() => {
    if (!currentPage?.type) {
      return ""
    }

    return currentPage.type.charAt(0).toUpperCase() + currentPage.type.slice(1)
  }, [currentPage?.type])

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground mt-2">You are viewing a shared invitation.</p>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card shadow-xl overflow-hidden">
          <InvitationPageRenderer
            eventId={eventId}
            page={currentPage}
            rsvpResponse={rsvpResponse}
            setRsvpResponse={setRsvpResponse}
          />
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPageIndex((index) => Math.max(0, index - 1))}
            disabled={currentPageIndex === 0}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </Button>

          <div className="text-center">
            <div className="text-sm text-muted-foreground">
              Page {currentPageIndex + 1} of {totalPages}
            </div>
            {subtitle && <div className="text-xs text-muted-foreground/80">{subtitle}</div>}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPageIndex((index) => Math.min(totalPages - 1, index + 1))}
            disabled={currentPageIndex === totalPages - 1}
          >
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  )
}
