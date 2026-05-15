"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { auth } from "@/lib/firebase"
import { onAuthStateChanged } from "firebase/auth"
import {
  ArrowUp,
  Paperclip,
  Sparkles,
  Calendar,
  Users,
  PartyPopper,
  Briefcase,
  Heart,
  GraduationCap,
  Baby,
  Cake
  , X
} from "lucide-react"

const quickPrompts = [
  { label: "Birthday Party", icon: Cake },
  { label: "Wedding Invitation", icon: Heart },
  { label: "Corporate Event", icon: Briefcase },
  { label: "Baby Shower", icon: Baby },
  { label: "Graduation", icon: GraduationCap },
  { label: "Social Gathering", icon: PartyPopper },
]

type RecentProject = {
  id: string
  title: string
  updatedAt: string
  thumbnail: "gradient-1" | "gradient-2" | "gradient-3"
}

function formatRelativeUpdatedAt(updatedAt: string) {
  const updated = new Date(updatedAt)
  if (Number.isNaN(updated.getTime())) return "Recently updated"

  const diffMs = Date.now() - updated.getTime()
  const minutes = Math.floor(diffMs / 60000)
  const hours = Math.floor(diffMs / 3600000)
  const days = Math.floor(diffMs / 86400000)

  if (minutes < 1) return "Just now"
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`

  return updated.toLocaleDateString(undefined, { month: "short", day: "numeric" })
}

function thumbnailForIndex(index: number): RecentProject["thumbnail"] {
  if (index % 3 === 0) return "gradient-1"
  if (index % 3 === 1) return "gradient-2"
  return "gradient-3"
}

export default function HomePage() {
  const [inputValue, setInputValue] = useState("")
  const [isFocused, setIsFocused] = useState(false)
  const [isDropOpen, setIsDropOpen] = useState(false)
  const [attachments, setAttachments] = useState<Array<{ id: string; file: File; preview: string }>>([])
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([])
  const [isLoadingProjects, setIsLoadingProjects] = useState(true)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const dropToggleRef = useRef<HTMLDivElement | null>(null)
  const panelRef = useRef<HTMLDivElement | null>(null)
  const router = useRouter()

  const createDraftId = () => {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID()
    }
    return `draft-${Date.now()}`
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputValue.trim()) {
      const draftId = createDraftId()
      router.push(`/editor?prompt=${encodeURIComponent(inputValue.trim())}&event=${encodeURIComponent(draftId)}`)
    }
  }

  const handleQuickPrompt = (prompt: string) => {
    const draftId = createDraftId()
    router.push(`/editor?prompt=${encodeURIComponent(prompt)}&event=${encodeURIComponent(draftId)}`)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  useEffect(() => {
    return () => {
      // Revoke object URLs on unmount
      attachments.forEach((a) => URL.revokeObjectURL(a.preview))
    }
  }, [attachments])

  useEffect(() => {
    if (!isDropOpen) return
    const onDocDown = (e: MouseEvent) => {
      const target = e.target as Node | null
      if (panelRef.current && panelRef.current.contains(target)) return
      if (dropToggleRef.current && dropToggleRef.current.contains(target)) return
      setIsDropOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsDropOpen(false)
    }
    document.addEventListener("mousedown", onDocDown)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onDocDown)
      document.removeEventListener("keydown", onKey)
    }
  }, [isDropOpen])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setRecentProjects([])
        setIsLoadingProjects(false)
        return
      }

      setIsLoadingProjects(true)

      try {
        const token = await user.getIdToken()
        const res = await fetch("/api/events/list", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        })

        if (!res.ok) {
          setRecentProjects([])
          return
        }

        const data = await res.json()
        if (!Array.isArray(data.events)) {
          setRecentProjects([])
          return
        }

        setRecentProjects(
          data.events.slice(0, 3).map((event: { id: string; title: string; updatedAt?: string }, index: number) => ({
            id: event.id,
            title: event.title,
            updatedAt: event.updatedAt ? formatRelativeUpdatedAt(event.updatedAt) : "Recently updated",
            thumbnail: thumbnailForIndex(index),
          }))
        )
      } catch (error) {
        console.error("Failed to load recent projects:", error)
        setRecentProjects([])
      } finally {
        setIsLoadingProjects(false)
      }
    })

    return () => unsubscribe()
  }, [])

  const handleFiles = (files: FileList | null) => {
    if (!files) return
    const allowed = Array.from(files).filter((f) => /image\/(png|jpe?g)/.test(f.type))
    const newAttachments = allowed.map((file) => ({
      id: `${Date.now()}-${Math.random()}`,
      file,
      preview: URL.createObjectURL(file),
    }))
    setAttachments((s) => [...s, ...newAttachments])
  }

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files)
    // keep dropbox open so user can see previews
  }

  const onRemoveAttachment = (id: string) => {
    setAttachments((s) => {
      const keep = s.filter((a) => a.id !== id)
      const removed = s.find((a) => a.id === id)
      if (removed) URL.revokeObjectURL(removed.preview)
      return keep
    })
  }

  const onDrop = (e: React.DragEvent) => {
    const files = e.dataTransfer?.files
    if (files && files.length) {
      e.preventDefault()
      e.stopPropagation()
      handleFiles(files)
    }
  }

  const onDragOver = (e: React.DragEvent) => {
    // Only prevent default when dragging files so text drops still work
    const types = Array.from(e.dataTransfer?.types || [])
    if (types.includes("Files")) {
      e.preventDefault()
    }
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex flex-col">
      {/* Main content - vertically centered */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl space-y-8">
          {/* Greeting */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
              What event would you like to create?
            </h1>
            <p className="text-muted-foreground">
              Describe your vision and let AI bring it to life.
            </p>
          </div>

          {/* Prompt input area */}
          <form onSubmit={handleSubmit}>
            <div
              onDrop={onDrop}
              onDragOver={onDragOver}
              className={`relative bg-card rounded-2xl border transition-all duration-200 ${isFocused
                ? "border-primary/50 shadow-lg shadow-primary/5"
                : "border-border/50"
                }`}
            >
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onKeyDown={handleKeyDown}
                placeholder="Create an elegant wedding invitation with floral accents and RSVP page..."
                rows={3}
                className="w-full bg-transparent px-4 pt-4 pb-4 text-base resize-none focus:outline-none placeholder:text-muted-foreground/60"
              />

              {/* Attachment previews section - text format below text */}
              {attachments.length > 0 && (
                <div className="border-t border-border/30 px-4 py-2 flex flex-wrap gap-2 items-center">
                  {attachments.map((a) => (
                    <div key={a.id} className="flex items-center gap-1 px-2 py-1 rounded bg-secondary/30 border border-border/40 text-xs">
                      <button
                        type="button"
                        onClick={() => window.open(a.preview, "_blank")}
                        className="hover:text-primary transition-colors cursor-pointer"
                        title={a.file.name}
                      >
                        {a.file.name.length > 20 ? `${a.file.name.slice(0, 17)}...` : a.file.name}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          onRemoveAttachment(a.id)
                        }}
                        className="ml-1 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                        aria-label="Remove attachment"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Input actions */}
              <div className="flex items-center justify-between px-4 py-3 border-t border-border/30">
                <div ref={dropToggleRef} className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png, image/jpeg"
                    multiple
                    onChange={onFileInputChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={() => setIsDropOpen((s) => !s)}
                  >
                    <Paperclip className="w-4 h-4" />
                  </Button>
                  <span className="text-xs text-muted-foreground">Attach inspiration images</span>

                  {isDropOpen && (
                    <div ref={panelRef} className="absolute left-4 bottom-full transform -translate-y-2 z-10">
                      <div className="relative">
                        <div className="absolute -bottom-1 left-4 w-3 h-3 bg-card/80 transform rotate-45" />
                        <div className="rounded-lg bg-card/80 border border-border/50 p-2 shadow-sm flex items-center gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            Open gallery
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <Button
                  type="submit"
                  size="icon"
                  disabled={!inputValue.trim()}
                  className={`h-8 w-8 rounded-lg transition-all ${inputValue.trim()
                    ? "gradient-primary border-0 text-white"
                    : "bg-secondary text-muted-foreground"
                    }`}
                >
                  <ArrowUp className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </form>

          {/* Quick prompts */}
          <div className="flex flex-wrap justify-center gap-2">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt.label}
                onClick={() => handleQuickPrompt(prompt.label)}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 hover:bg-secondary text-sm text-muted-foreground hover:text-foreground transition-smooth"
              >
                <prompt.icon className="w-4 h-4" />
                {prompt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Recent projects - bottom section */}
      <div className="border-t border-border/50 bg-card/30 px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-muted-foreground">Recent Projects</span>
            <Link href="/dashboard" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {isLoadingProjects ? (
              Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="bg-card rounded-xl border border-border/50 overflow-hidden animate-pulse">
                  <div className="h-24 bg-secondary/40" />
                  <div className="p-3 space-y-2">
                    <div className="h-4 w-2/3 bg-secondary/60 rounded" />
                    <div className="h-3 w-1/3 bg-secondary/50 rounded" />
                  </div>
                </div>
              ))
            ) : recentProjects.length > 0 ? (
              recentProjects.map((project) => (
                <Link
                  key={project.id}
                  href={`/editor?event=${project.id}`}
                  className="group"
                >
                  <div className="bg-card rounded-xl border border-border/50 overflow-hidden hover:border-primary/30 transition-smooth">
                    {/* Thumbnail */}
                    <div className={`h-24 ${project.thumbnail === "gradient-1"
                      ? "bg-gradient-to-br from-primary/30 to-accent/20"
                      : project.thumbnail === "gradient-2"
                        ? "bg-gradient-to-br from-accent/30 to-chart-3/20"
                        : "bg-gradient-to-br from-chart-3/30 to-primary/20"
                      }`}>
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="w-16 h-20 bg-card/80 rounded-lg shadow-lg flex items-center justify-center">
                          <Sparkles className="w-5 h-5 text-muted-foreground" />
                        </div>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-3">
                      <h4 className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                        {project.title}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {project.updatedAt}
                      </p>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-full rounded-xl border border-dashed border-border/60 bg-card/40 px-4 py-6 text-sm text-muted-foreground">
                You have no recent projects.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
