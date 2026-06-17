"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { InvitationPageRenderer, getInvitationBrandStyles } from "@/components/invitation/invitation-page-renderer"
import type { BrandSettings } from "@/lib/branding"
import { auth } from "@/lib/firebase"
import { onAuthStateChanged } from "firebase/auth"
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react"

type InvitationPage = {
  id: string
  type: string
  content: Record<string, unknown>
}

export function PublicInvitationView({
  eventId,
  title,
  pages,
  brand,
}: {
  eventId: string
  title: string
  pages: InvitationPage[]
  brand?: BrandSettings | null
}) {
  const [currentPageIndex, setCurrentPageIndex] = useState(0)
  const [rsvpResponse, setRsvpResponse] = useState<"attending" | "not-attending" | null>(null)
  const [showSignupPrompt, setShowSignupPrompt] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null)
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const promptShownRef = useRef(false)

  const totalPages = pages.length
  const currentPage = pages[currentPageIndex]
  const isOnFinalPage = currentPageIndex === totalPages - 1

  // Track auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user)
    })
    return () => unsubscribe()
  }, [])

  // Start/reset idle timer when on the final page and not logged in
  useEffect(() => {
    if (!isOnFinalPage || isLoggedIn || isLoggedIn === null || promptShownRef.current) return

    const IDLE_MS = 5000
    const interactionEvents = ["mousemove", "keydown", "touchstart", "scroll", "click"] as const

    const resetTimer = () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
      idleTimerRef.current = setTimeout(() => {
        if (!promptShownRef.current) {
          promptShownRef.current = true
          setShowSignupPrompt(true)
        }
      }, IDLE_MS)
    }

    resetTimer()
    interactionEvents.forEach((e) => window.addEventListener(e, resetTimer, { passive: true }))

    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
      interactionEvents.forEach((e) => window.removeEventListener(e, resetTimer))
    }
  }, [isOnFinalPage, isLoggedIn])

  const subtitle = useMemo(() => {
    if (!currentPage?.type) {
      return ""
    }

    return currentPage.type.charAt(0).toUpperCase() + currentPage.type.slice(1)
  }, [currentPage?.type])

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6" style={getInvitationBrandStyles(brand)}>
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground mt-2">You are viewing a shared invitation.</p>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card shadow-xl overflow-hidden" style={getInvitationBrandStyles(brand)}>
          <InvitationPageRenderer
            page={currentPage}
            rsvpResponse={rsvpResponse}
            setRsvpResponse={setRsvpResponse}
            brand={brand}
            onNavigateNext={() => setCurrentPageIndex((index) => Math.min(totalPages - 1, index + 1))}
            eventId={eventId}
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

      <Dialog open={showSignupPrompt} onOpenChange={setShowSignupPrompt}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Create your own invitations
            </DialogTitle>
            <DialogDescription>
              Loved this invitation? Sign up free and start building beautiful event invitations in minutes.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 pt-2">
            <Button
              className="w-full"
              onClick={() => {
                setShowSignupPrompt(false)
                window.location.href = "/get-started"
              }}
            >
              Create a free account
            </Button>
            <Button
              variant="ghost"
              className="w-full text-muted-foreground"
              onClick={() => setShowSignupPrompt(false)}
            >
              Maybe later
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
