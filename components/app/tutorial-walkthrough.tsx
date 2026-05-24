"use client"

import { useEffect, useState } from "react"
import { useRef } from "react"
import { usePathname, useRouter } from "next/navigation"
import { onAuthStateChanged } from "firebase/auth"
import { ArrowRight, CheckCircle2, ChevronLeft, ChevronRight, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { auth } from "@/lib/firebase"
import { fetchWithAuth } from "@/lib/api-client"
import { getCurrentUserProfile } from "@/lib/profile"

type TutorialStep = {
  id: string
  title: string
  description: string
  navHint: string
  route: string
}

const TUTORIAL_GUEST_LIST_EVENT_ID = "tutorial-preview"

const tutorialSteps: TutorialStep[] = [
  {
    id: "home",
    title: "Start on Home",
    description:
      "This is the launch pad. Type a prompt to start a draft or use the quick prompts below to begin faster.",
    navHint: "Use the top navigation bar to move around. Home is where you start new work.",
    route: "/home",
  },
  {
    id: "dashboard",
    title: "Dashboard overview",
    description:
      "Use Dashboard to see all of your events, check status, and jump back into anything you were already building.",
    navHint: "Click Dashboard in the top nav when you want a high-level view of your projects.",
    route: "/dashboard",
  },
  {
    id: "editor",
    title: "Build in the Editor",
    description:
      "Builder now redirects here. The left side switches pages like Cover, Details, and RSVP while the toolbar handles undo, redo, preview, and publish.",
    navHint: "Use the Editor route from the top nav to edit the invitation pages themselves.",
    route: "/editor",
  },
  {
    id: "preview",
    title: "Preview the invitation",
    description:
      "Preview shows the invitation as guests will see it. Switch between desktop and mobile to check spacing and flow.",
    navHint: "Open Preview from the top nav whenever you want to verify the final layout.",
    route: "/preview",
  },
  {
    id: "guest-list",
    title: "Track RSVPs",
    description:
      "The guest list keeps RSVP responses organized so you can see who is attending and who still needs a follow-up.",
    navHint: "Use Events to jump into a specific invitation, then open the guest list for that event.",
    route: `/guest-list/${TUTORIAL_GUEST_LIST_EVENT_ID}`,
  },
  {
    id: "publish",
    title: "Share from Publish",
    description:
      "Publish is where you copy the invite link, choose who gets access, and send email invitations directly from the app.",
    navHint: "Use Publish when you are ready to send the invitation out.",
    route: "/publish",
  },
  {
    id: "connections",
    title: "Reuse connections",
    description:
      "Connections lets you keep a reusable list of people you invite often so sending future events is quicker.",
    navHint: "Open Connections from the top navigation to manage your contact list.",
    route: "/connections",
  },
  {
    id: "settings",
    title: "Finish in Settings",
    description:
      "Settings is where you update your profile, brand kit, notifications, and privacy preferences.",
    navHint: "Use Settings from the top nav whenever you need to update account details.",
    route: "/settings",
  },
]

export function TutorialWalkthrough() {
  const pathname = usePathname()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const [isCompleting, setIsCompleting] = useState(false)

  const prevPathRef = useRef<string | null>(null)
  const navTimerRef = useRef<number | null>(null)
  const currentStep = tutorialSteps[currentStepIndex]
  const isFinalStep = currentStepIndex === tutorialSteps.length - 1

  const stepIndexForPath = tutorialSteps.findIndex(
    (step) => step.route === pathname || (step.id === "guest-list" && pathname.startsWith("/guest-list/")),
  )

  useEffect(() => {
    let isActive = true

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        if (isActive) {
          setIsOpen(false)
          setIsLoadingProfile(false)
        }
        return
      }

      try {
        const profile = await getCurrentUserProfile()
        if (!isActive) return

        setIsOpen(!profile.hasCompletedTutorial)
        setCurrentStepIndex(stepIndexForPath >= 0 ? stepIndexForPath : 0)
      } catch (error) {
        console.error("Failed to load tutorial state:", error)
        if (isActive) {
          setIsOpen(false)
        }
      } finally {
        if (isActive) {
          setIsLoadingProfile(false)
        }
      }
    })

    return () => {
      isActive = false
      unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!isOpen) return
    // Only update when the pathname actually changes (not when internal index changes)
    if (prevPathRef.current !== pathname) {
      if (stepIndexForPath >= 0 && stepIndexForPath !== currentStepIndex) {
        setCurrentStepIndex(stepIndexForPath)
      }
      prevPathRef.current = pathname
    }
    // Keep dependency array constant: [isOpen, pathname, currentStepIndex]
  }, [isOpen, pathname, currentStepIndex])

  // Sync tutorial state to localStorage so other pages (like Preview) can react
  useEffect(() => {
    try {
      localStorage.setItem("invyra-tutorial-is-open", isOpen ? "true" : "false")
      localStorage.setItem("invyra-tutorial-current-step", String(currentStepIndex))
    } catch (e) {
      /* ignore */
    }
    return () => {
      try {
        localStorage.removeItem("invyra-tutorial-is-open")
        localStorage.removeItem("invyra-tutorial-current-step")
      } catch (e) {
        /* ignore */
      }
    }
  }, [isOpen, currentStepIndex])

  const completeTutorial = async () => {
    setIsCompleting(true)
    try {
      await fetchWithAuth("/api/profile/tutorial-complete", {
        method: "POST",
      })
    } catch (error) {
      console.error("Failed to mark tutorial complete:", error)
    } finally {
      setIsCompleting(false)
      setIsOpen(false)
    }
  }

  const goToStep = (index: number) => {
    const nextStep = tutorialSteps[index]
    if (!nextStep) return

    setCurrentStepIndex(index)
    // Clear any pending navigation
    if (navTimerRef.current) {
      window.clearTimeout(navTimerRef.current)
      navTimerRef.current = null
    }

    if (nextStep.route === "/preview") {
      // Ensure preview page has sample data so it doesn't behave oddly
      const samplePreview = {
        id: "tutorial-preview",
        title: "Tutorial Preview",
        theme: { primaryColor: "from-accent via-primary to-chart-3", backgroundColor: "bg-card" },
        pages: [
          { id: "cover", type: "cover", content: { headline: "You're Invited", subheadline: "Tutorial preview" } },
        ],
      }
      try {
        localStorage.setItem("invyra-preview-data", JSON.stringify(samplePreview))
      } catch (e) {
        /* ignore */
      }
      // Small delay so the UI updates before route change
      navTimerRef.current = window.setTimeout(() => {
        router.push(nextStep.route)
        navTimerRef.current = null
      }, 300)
      return
    }

    if (nextStep.route !== pathname) {
      router.push(nextStep.route)
    }
  }

  const handlePrimaryAction = () => {
    if (isFinalStep) {
      void completeTutorial()
      return
    }

    goToStep(currentStepIndex + 1)
  }

  const handlePrevious = () => {
    goToStep(Math.max(0, currentStepIndex - 1))
  }

  if (!isOpen || isLoadingProfile) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[min(24rem,calc(100vw-2rem))] pointer-events-none">
      <div className="pointer-events-auto rounded-2xl border border-border/60 bg-card/95 p-4 shadow-2xl shadow-black/20 backdrop-blur-xl">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 pr-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">Tutorial guide</p>
            <h2 className="text-base font-semibold tracking-tight">{currentStep.title}</h2>
          </div>

          <button
            type="button"
            onClick={completeTutorial}
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="Close tutorial"
            disabled={isCompleting}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-2 text-sm leading-6 text-muted-foreground">{currentStep.description}</p>

        <div className="mt-3 rounded-xl border border-primary/15 bg-primary/5 px-3 py-2 text-sm text-muted-foreground">
          {currentStep.navHint}
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            Step {currentStepIndex + 1} of {tutorialSteps.length}
          </p>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevious}
              disabled={currentStepIndex === 0 || isCompleting}
              className="gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>

            <Button size="sm" onClick={handlePrimaryAction} disabled={isCompleting} className="gap-1">
              {isFinalStep ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Finish tour
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>

        <button
          type="button"
          onClick={completeTutorial}
          className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          disabled={isCompleting}
        >
          Skip the tour
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
