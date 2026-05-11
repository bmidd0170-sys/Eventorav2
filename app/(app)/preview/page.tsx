"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { InvitationPageRenderer as SharedInvitationPageRenderer } from "@/components/invitation/invitation-page-renderer"
import {
  ChevronLeft,
  ChevronRight,
  Smartphone,
  Monitor,
  X,
  Calendar,
  Clock,
  MapPin,
  ExternalLink,
  FileText
} from "lucide-react"

// Page type definitions
interface PageContent {
  headline?: string
  subheadline?: string
  hostName?: string
  backgroundImage?: string | null
  date?: string
  time?: string
  location?: string
  address?: string
  description?: string
  dressCode?: string
  venue?: string
  directions?: string
  mapUrl?: string
  registryUrl?: string
  registryName?: string
  message?: string
  items?: Array<{ time: string; title: string; description: string }>
  images?: string[]
  questions?: Array<{ question: string; answer: string }>
  fields?: Array<{ label: string; type: string; required: boolean; options?: string[] }>
  elements?: InvitationElement[]
}

interface InvitationElement {
  id: string
  type: "container" | "text" | "image" | "button" | "badge" | "divider" | "spacer"
  order?: number
  content?: {
    text?: string
    title?: string
    description?: string
    label?: string
    src?: string
    alt?: string
    href?: string
  }
  style?: {
    background?: string
    color?: string
    border?: string
    radius?: string
    padding?: string
    margin?: string
    shadow?: string
    width?: string
    height?: string
    gap?: string
    textAlign?: "left" | "center" | "right"
    display?: "block" | "flex" | "grid"
    justifyContent?: "flex-start" | "center" | "space-between" | "flex-end"
    alignItems?: "flex-start" | "center" | "flex-end" | "stretch"
    gridTemplateColumns?: string
  }
  children?: InvitationElement[]
}

interface InvitationPage {
  id: string
  type: string
  content: PageContent
}

interface InvitationData {
  id: string
  title: string
  theme: {
    primaryColor: string
    backgroundColor: string
  }
  pages: InvitationPage[]
}

// Default sample data - used when no data is passed
const defaultInvitation: InvitationData = {
  id: "default",
  title: "Your Invitation",
  theme: {
    primaryColor: "from-accent via-primary to-chart-3",
    backgroundColor: "bg-card",
  },
  pages: [
    {
      id: "cover",
      type: "cover",
      content: {
        headline: "You're Invited",
        subheadline: "to a Special Celebration",
        hostName: "Your Name",
      }
    }
  ]
}

export default function PreviewPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [currentPageIndex, setCurrentPageIndex] = useState(0)
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop")
  const [rsvpResponse, setRsvpResponse] = useState<"attending" | "not-attending" | null>(null)
  const [invitation, setInvitation] = useState<InvitationData>(defaultInvitation)

  // Load invitation data from localStorage (set by editor)
  useEffect(() => {
    const storedData = localStorage.getItem("eventora-preview-data")
    if (storedData) {
      try {
        const parsed = JSON.parse(storedData)
        setInvitation(parsed)
      } catch (e) {
        console.error("Failed to parse preview data", e)
      }
    }
  }, [])

  const currentPage = invitation.pages[currentPageIndex]
  const totalPages = invitation.pages.length

  const goToNextPage = () => {
    if (currentPageIndex < totalPages - 1) {
      setCurrentPageIndex(currentPageIndex + 1)
    }
  }

  const goToPrevPage = () => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex(currentPageIndex - 1)
    }
  }

  return (
    <div className="fixed inset-0 bg-[#0a0a0f] z-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="h-14 shrink-0 border-b border-border/30 bg-card/50 backdrop-blur-sm flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-sm font-medium">{invitation.title}</h1>
            <p className="text-xs text-muted-foreground">Preview Mode - This is how your guests will see the invitation</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Device toggle */}
          <div className="flex items-center bg-secondary rounded-lg p-0.5">
            <Button
              variant={previewMode === "desktop" ? "secondary" : "ghost"}
              size="icon"
              className="h-8 w-8"
              onClick={() => setPreviewMode("desktop")}
            >
              <Monitor className="w-4 h-4" />
            </Button>
            <Button
              variant={previewMode === "mobile" ? "secondary" : "ghost"}
              size="icon"
              className="h-8 w-8"
              onClick={() => setPreviewMode("mobile")}
            >
              <Smartphone className="w-4 h-4" />
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            className="border-border/50"
          >
            Exit Preview
          </Button>
        </div>
      </div>

      {/* Preview area */}
      <div className="flex-1 min-h-0 flex items-center justify-center p-4 md:p-8">
        <div
          className={`h-full max-h-full flex flex-col transition-all duration-300 ${previewMode === "mobile"
              ? "w-[375px]"
              : "w-full max-w-2xl"
            }`}
        >
          {/* Phone frame for mobile */}
          <div className={`relative flex-1 min-h-0 ${previewMode === "mobile" ? "mx-3" : ""}`}>
            {previewMode === "mobile" && (
              <>
                <div className="absolute -inset-3 bg-card rounded-[2.5rem] border border-border/50 shadow-2xl pointer-events-none" />
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-24 h-6 bg-card rounded-b-xl flex items-center justify-center z-10 pointer-events-none">
                  <div className="w-12 h-1.5 bg-secondary rounded-full" />
                </div>
              </>
            )}

            {/* Invitation content - scrollable */}
            <div
              className={`h-full bg-card overflow-y-auto shadow-2xl ${previewMode === "mobile"
                  ? "rounded-[2rem] relative z-10"
                  : "rounded-2xl"
                }`}
            >
              <SharedInvitationPageRenderer
                page={currentPage}
                rsvpResponse={rsvpResponse}
                setRsvpResponse={setRsvpResponse}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Page navigation */}
      <div className="h-16 shrink-0 border-t border-border/30 bg-card/50 backdrop-blur-sm flex items-center justify-center px-4 relative">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={goToPrevPage}
            disabled={currentPageIndex === 0}
            className="h-10 w-10"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>

          {/* Page indicators */}
          <div className="flex items-center gap-2">
            {invitation.pages.map((page, index) => (
              <button
                key={page.id}
                onClick={() => setCurrentPageIndex(index)}
                className={`transition-all ${index === currentPageIndex
                    ? "w-8 h-2 rounded-full gradient-primary"
                    : "w-2 h-2 rounded-full bg-muted-foreground/30 hover:bg-muted-foreground/50"
                  }`}
              />
            ))}
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={goToNextPage}
            disabled={currentPageIndex === totalPages - 1}
            className="h-10 w-10"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        <div className="absolute right-4 flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Page {currentPageIndex + 1} of {totalPages}
          </span>
          <span className="text-xs text-muted-foreground/60 capitalize">
            ({currentPage?.type || "page"})
          </span>
        </div>
      </div>
    </div>
  )
}

function InvitationPageRenderer({
  page,
  rsvpResponse,
  setRsvpResponse
}: {
  page: InvitationPage
  rsvpResponse: "attending" | "not-attending" | null
  setRsvpResponse: (response: "attending" | "not-attending" | null) => void
}) {
  if (!page) {
    return <div className="p-8 text-center text-muted-foreground">No page to display</div>
  }

  let pageContent: React.ReactNode = null

  switch (page.type) {
    case "cover":
      pageContent = <CoverPage content={page.content} />
      break
    case "details":
      pageContent = <DetailsPage content={page.content} />
      break
    case "rsvp":
      pageContent = <RSVPPage content={page.content} rsvpResponse={rsvpResponse} setRsvpResponse={setRsvpResponse} />
      break
    case "location":
      pageContent = <LocationPage content={page.content} />
      break
    case "schedule":
      pageContent = <SchedulePage content={page.content} />
      break
    case "gallery":
      pageContent = <GalleryPage content={page.content} />
      break
    case "registry":
      pageContent = <RegistryPage content={page.content} />
      break
    case "faq":
      pageContent = <FAQPage content={page.content} />
      break
    default:
      pageContent = <GenericPage content={page.content} type={page.type} />
      break
  }

  return (
    <>
      {pageContent}
      <InvitationElements elements={page.content.elements} />
    </>
  )
}

function InvitationElements({ elements }: { elements?: InvitationElement[] }) {
  if (!elements?.length) {
    return null
  }

  const sortedElements = [...elements].sort((left, right) => (left.order ?? 0) - (right.order ?? 0))

  return (
    <div className="px-6 pb-8 md:px-8 space-y-4">
      {sortedElements.map((element) => (
        <InvitationElementRenderer key={element.id} element={element} />
      ))}
    </div>
  )
}

function InvitationElementRenderer({ element }: { element: InvitationElement }) {
  const content = element.content ?? {}
  const style = element.style ?? {}
  const baseStyle: React.CSSProperties = {
    background: style.background,
    color: style.color,
    border: style.border,
    borderRadius: style.radius,
    padding: style.padding,
    margin: style.margin,
    boxShadow: style.shadow,
    width: style.width,
    height: style.height,
    textAlign: style.textAlign,
  }

  if (element.type === "spacer") {
    return <div aria-hidden style={{ height: style.height || "1rem" }} />
  }

  if (element.type === "divider") {
    return <div aria-hidden className="h-px w-full bg-border/60" style={{ margin: style.margin }} />
  }

  if (element.type === "image") {
    return (
      <div className="overflow-hidden rounded-xl" style={baseStyle}>
        <img
          src={content.src || "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80"}
          alt={content.alt || content.title || content.text || "Invitation image"}
          className="block w-full object-cover"
          style={{ height: style.height || "240px" }}
        />
        {(content.title || content.description) && (
          <div className="p-4 space-y-1">
            {content.title && <p className="font-medium text-sm">{content.title}</p>}
            {content.description && <p className="text-xs text-muted-foreground">{content.description}</p>}
          </div>
        )}
      </div>
    )
  }

  if (element.type === "button") {
    return (
      <div className="flex" style={{ justifyContent: style.justifyContent || "flex-start" }}>
        <Button className="gradient-primary border-0 text-white" style={baseStyle} asChild={Boolean(content.href)}>
          {content.href ? (
            <a href={content.href} target="_blank" rel="noopener noreferrer">
              {content.label || content.text || "Button"}
            </a>
          ) : (
            <span>{content.label || content.text || "Button"}</span>
          )}
        </Button>
      </div>
    )
  }

  if (element.type === "badge") {
    return (
      <div className="flex" style={{ justifyContent: style.justifyContent || "center" }}>
        <span className="inline-flex items-center rounded-full border border-border/60 px-3 py-1 text-xs font-medium" style={baseStyle}>
          {content.label || content.text || content.title || "Badge"}
        </span>
      </div>
    )
  }

  if (element.type === "container") {
    return (
      <div
        className="space-y-3"
        style={{
          ...baseStyle,
          display: style.display || "block",
          gap: style.gap,
          justifyContent: style.justifyContent,
          alignItems: style.alignItems,
          gridTemplateColumns: style.gridTemplateColumns,
        }}
      >
        {content.title && <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{content.title}</p>}
        {content.description && <p className="text-sm text-muted-foreground">{content.description}</p>}
      </div>
    )
  }

  return (
    <div className="space-y-2" style={baseStyle}>
      {content.title && <p className="text-lg font-semibold">{content.title}</p>}
      {content.text && <p className="text-sm leading-relaxed text-muted-foreground">{content.text}</p>}
      {content.description && <p className="text-sm leading-relaxed text-muted-foreground">{content.description}</p>}
    </div>
  )
}

function CoverPage({ content }: { content: PageContent }) {
  return (
    <div className="relative min-h-[400px] flex flex-col items-center justify-center text-center p-6 md:p-8">
      {/* Decorative background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-accent/10 to-chart-3/20" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(255,255,255,0.08),transparent_70%)]" />

      {/* Decorative elements */}
      <div className="absolute top-6 left-6 w-12 h-12 border border-primary/20 rounded-full" />
      <div className="absolute bottom-8 right-8 w-16 h-16 border border-accent/20 rounded-full" />

      <div className="relative z-10 space-y-4">
        <div className="w-14 h-14 mx-auto rounded-2xl gradient-primary flex items-center justify-center mb-6">
          <FileText className="w-7 h-7 text-white" />
        </div>

        <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground to-muted-foreground bg-clip-text text-balance">
          {content.headline || "You're Invited"}
        </h1>

        <p className="text-lg text-muted-foreground">
          {content.subheadline || "to a Special Event"}
        </p>

        {content.hostName && (
          <div className="pt-4">
            <p className="text-sm text-muted-foreground/80">Hosted by</p>
            <p className="text-lg font-medium mt-1">{content.hostName}</p>
          </div>
        )}

        <div className="pt-6">
          <Button className="gradient-primary border-0 text-white px-6">
            View Details
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  )
}

function DetailsPage({ content }: { content: PageContent }) {
  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-xl md:text-2xl font-semibold">{content.headline || "Event Details"}</h2>
      </div>

      <div className="space-y-3">
        {content.date && (
          <div className="flex items-start gap-3 p-3 bg-secondary/50 rounded-xl">
            <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Date</p>
              <p className="font-medium text-sm">{content.date}</p>
            </div>
          </div>
        )}

        {content.time && (
          <div className="flex items-start gap-3 p-3 bg-secondary/50 rounded-xl">
            <div className="w-9 h-9 rounded-lg bg-accent/20 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 text-accent" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Time</p>
              <p className="font-medium text-sm">{content.time}</p>
            </div>
          </div>
        )}

        {content.location && (
          <div className="flex items-start gap-3 p-3 bg-secondary/50 rounded-xl">
            <div className="w-9 h-9 rounded-lg bg-chart-3/20 flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4 text-chart-3" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Location</p>
              <p className="font-medium text-sm">{content.location}</p>
              {content.address && <p className="text-xs text-muted-foreground">{content.address}</p>}
            </div>
          </div>
        )}
      </div>

      {content.description && (
        <div className="pt-3 border-t border-border/50">
          <p className="text-muted-foreground text-sm leading-relaxed">{content.description}</p>
        </div>
      )}

      {content.dressCode && (
        <div className="flex items-center justify-center gap-2 text-sm">
          <span className="text-muted-foreground">Dress Code:</span>
          <span className="font-medium">{content.dressCode}</span>
        </div>
      )}
    </div>
  )
}

function RSVPPage({
  content,
  rsvpResponse,
  setRsvpResponse
}: {
  content: PageContent
  rsvpResponse: "attending" | "not-attending" | null
  setRsvpResponse: (response: "attending" | "not-attending" | null) => void
}) {
  const [submitted, setSubmitted] = useState(false)

  if (submitted) {
    return (
      <div className="p-6 md:p-8 min-h-[300px] flex flex-col items-center justify-center text-center">
        <div className="w-14 h-14 rounded-full gradient-primary flex items-center justify-center mb-4">
          <Calendar className="w-7 h-7 text-white" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Thank You!</h2>
        <p className="text-muted-foreground text-sm">
          Your RSVP has been received. We look forward to seeing you!
        </p>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8 space-y-5">
      <div className="text-center space-y-1">
        <h2 className="text-xl md:text-2xl font-semibold">{content.headline || "RSVP"}</h2>
        {content.subheadline && <p className="text-muted-foreground text-sm">{content.subheadline}</p>}
      </div>

      {/* Response buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => setRsvpResponse("attending")}
          className={`flex-1 py-3 rounded-xl border-2 transition-all ${rsvpResponse === "attending"
              ? "border-accent bg-accent/10 text-accent"
              : "border-border/50 hover:border-accent/50"
            }`}
        >
          <p className="font-medium text-sm">Attending</p>
          <p className="text-xs text-muted-foreground mt-0.5">Count me in!</p>
        </button>
        <button
          onClick={() => setRsvpResponse("not-attending")}
          className={`flex-1 py-3 rounded-xl border-2 transition-all ${rsvpResponse === "not-attending"
              ? "border-destructive bg-destructive/10 text-destructive"
              : "border-border/50 hover:border-destructive/50"
            }`}
        >
          <p className="font-medium text-sm">Not Attending</p>
          <p className="text-xs text-muted-foreground mt-0.5">{"Can't make it"}</p>
        </button>
      </div>

      {rsvpResponse === "attending" && (
        <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
          {content.fields?.map((field, index) => (
            <div key={index} className="space-y-1.5">
              <label className="text-sm font-medium">
                {field.label}
                {field.required && <span className="text-destructive ml-1">*</span>}
              </label>
              {field.type === "textarea" ? (
                <textarea
                  className="w-full px-3 py-2 bg-secondary rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                  rows={2}
                  placeholder={`Enter ${field.label.toLowerCase()}...`}
                />
              ) : field.type === "select" ? (
                <select className="w-full px-3 py-2 bg-secondary rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                  <option value="">Select...</option>
                  {field.options?.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              ) : (
                <input
                  type={field.type}
                  className="w-full px-3 py-2 bg-secondary rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder={`Enter ${field.label.toLowerCase()}...`}
                />
              )}
            </div>
          ))}

          <Button
            className="w-full gradient-primary border-0 text-white py-5"
            onClick={() => setSubmitted(true)}
          >
            Submit RSVP
          </Button>
        </div>
      )}

      {rsvpResponse === "not-attending" && (
        <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Send a message (optional)</label>
            <textarea
              className="w-full px-3 py-2 bg-secondary rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
              rows={2}
              placeholder="Sorry I can't make it..."
            />
          </div>
          <Button
            variant="outline"
            className="w-full py-5"
            onClick={() => setSubmitted(true)}
          >
            Send Response
          </Button>
        </div>
      )}
    </div>
  )
}

function LocationPage({ content }: { content: PageContent }) {
  return (
    <div className="p-6 md:p-8 space-y-5">
      <div className="text-center space-y-1">
        <h2 className="text-xl md:text-2xl font-semibold">{content.headline || "Location"}</h2>
      </div>

      {/* Map placeholder */}
      <div className="aspect-[16/10] bg-secondary/50 rounded-xl flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="text-center">
          <MapPin className="w-10 h-10 mx-auto text-muted-foreground/30 mb-2" />
          <p className="text-xs text-muted-foreground">Map Preview</p>
        </div>
      </div>

      <div className="space-y-3">
        {(content.venue || content.address) && (
          <div className="p-3 bg-secondary/50 rounded-xl">
            {content.venue && <h3 className="font-medium text-sm mb-0.5">{content.venue}</h3>}
            {content.address && <p className="text-xs text-muted-foreground">{content.address}</p>}
          </div>
        )}

        {content.directions && (
          <p className="text-xs text-muted-foreground">{content.directions}</p>
        )}

        {content.mapUrl && (
          <Button variant="outline" className="w-full border-border/50" asChild>
            <a href={content.mapUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4 mr-2" />
              Open in Maps
            </a>
          </Button>
        )}
      </div>
    </div>
  )
}

function SchedulePage({ content }: { content: PageContent }) {
  return (
    <div className="p-6 md:p-8 space-y-5">
      <div className="text-center space-y-1">
        <h2 className="text-xl md:text-2xl font-semibold">{content.headline || "Schedule"}</h2>
      </div>

      <div className="space-y-3">
        {content.items?.map((item, index) => (
          <div
            key={index}
            className="flex gap-3 p-3 bg-secondary/50 rounded-xl relative"
          >
            {/* Timeline connector */}
            {index < (content.items?.length || 0) - 1 && (
              <div className="absolute left-[1.85rem] top-14 bottom-0 w-px bg-border/50 -mb-3" />
            )}

            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center shrink-0 relative z-10">
              <Clock className="w-4 h-4 text-white" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-medium text-primary">{item.time}</span>
              </div>
              <h3 className="font-medium text-sm">{item.title}</h3>
              {item.description && (
                <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function GalleryPage({ content }: { content: PageContent }) {
  return (
    <div className="p-6 md:p-8 space-y-5">
      <div className="text-center space-y-1">
        <h2 className="text-xl md:text-2xl font-semibold">{content.headline || "Gallery"}</h2>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {(content.images || [1, 2, 3, 4]).map((_, index) => (
          <div key={index} className="aspect-square bg-secondary/50 rounded-lg flex items-center justify-center">
            <span className="text-muted-foreground/30 text-xs">Image {index + 1}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function RegistryPage({ content }: { content: PageContent }) {
  return (
    <div className="p-6 md:p-8 space-y-5">
      <div className="text-center space-y-1">
        <h2 className="text-xl md:text-2xl font-semibold">{content.headline || "Gift Registry"}</h2>
        {content.message && <p className="text-muted-foreground text-sm">{content.message}</p>}
      </div>

      <div className="p-4 bg-secondary/50 rounded-xl text-center">
        <p className="font-medium text-sm mb-2">{content.registryName || "Our Registry"}</p>
        {content.registryUrl && (
          <Button variant="outline" size="sm" asChild>
            <a href={content.registryUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4 mr-2" />
              View Registry
            </a>
          </Button>
        )}
      </div>
    </div>
  )
}

function FAQPage({ content }: { content: PageContent }) {
  return (
    <div className="p-6 md:p-8 space-y-5">
      <div className="text-center space-y-1">
        <h2 className="text-xl md:text-2xl font-semibold">{content.headline || "FAQ"}</h2>
      </div>

      <div className="space-y-3">
        {(content.questions || [
          { question: "What should I wear?", answer: "Smart casual attire is recommended." },
          { question: "Is parking available?", answer: "Yes, free parking is available on site." }
        ]).map((item, index) => (
          <div key={index} className="p-3 bg-secondary/50 rounded-xl">
            <p className="font-medium text-sm mb-1">{item.question}</p>
            <p className="text-xs text-muted-foreground">{item.answer}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function GenericPage({ content, type }: { content: PageContent; type: string }) {
  return (
    <div className="p-6 md:p-8 space-y-5">
      <div className="text-center space-y-1">
        <h2 className="text-xl md:text-2xl font-semibold capitalize">{content.headline || type}</h2>
        {content.subheadline && <p className="text-muted-foreground text-sm">{content.subheadline}</p>}
      </div>

      {content.description && (
        <p className="text-muted-foreground text-sm leading-relaxed">{content.description}</p>
      )}
    </div>
  )
}
