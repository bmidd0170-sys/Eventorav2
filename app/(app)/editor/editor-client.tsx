"use client"

import { useState, useRef, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { defaultInvitationId, getInvitationById } from "@/lib/invitations"
import { auth } from "@/lib/auth/client"
import { onAuthStateChanged } from "firebase/auth"
import { getUserBranding, applyBrandSettingsToPages } from "@/lib/branding"
import { getInvitationBrandStyles } from "@/components/invitation/invitation-page-renderer"
import {
  Sparkles,
  Send,
  Plus,
  Copy,
  Download,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Check,
  Undo2,
  Redo2,
  Eye,
  Smartphone,
  Monitor,
  Settings,
  Palette,
  Type,
  Image as ImageIcon,
  Trash2,
  GripVertical,
  Calendar,
  Clock,
  MapPin,
  Users,
  Gift,
  MessageSquare,
  FileText,
  Layers
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Types
type InvitePage = {
  id: string
  name: string
  icon: React.ElementType
  content: PageContent
}

type InvitationElement = {
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
    align?: "left" | "center" | "right"
    columns?: number
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

type PageContent = {
  headline?: string
  subheadline?: string
  body?: string
  date?: string
  time?: string
  location?: string
  buttons?: { label: string; action: string }[]
  fields?: { label: string; type: string; required: boolean }[]
  items?: { icon: string; label: string; value: string }[]
  elements?: InvitationElement[]
  images?: string[]
}

type Message = {
  id: string
  role: "assistant" | "user"
  content: string
  timestamp: Date
  images?: string[]
}

type StoredDraftImage = {
  name: string
  type: string
  data: string
}

type Version = {
  id: string
  label: string
  timestamp: Date
  pages: InvitePage[]
}

type StarterTemplate = {
  title: string
  pages: InvitePage[]
}

type AiAction =
  | {
    type: "patch_page"
    pageId: string
    content: Partial<PageContent>
  }
  | {
    type: "add_page"
    pageType: string
    name?: string
    content?: Partial<PageContent>
  }
  | {
    type: "focus_page"
    pageId: string
  }
  | {
    type: "add_element"
    pageId: string
    element: InvitationElement
    parentElementId?: string
  }
  | {
    type: "patch_element"
    pageId: string
    elementId: string
    content: Partial<InvitationElement>
  }
  | {
    type: "remove_element"
    pageId: string
    elementId: string
  }
  | {
    type: "focus_element"
    pageId: string
    elementId: string
  }

type AiEditorResponse = {
  reply: string
  actions?: AiAction[]
}

// Initial pages for a multi-page invite
const defaultPages: InvitePage[] = [
  {
    id: "cover",
    name: "Cover",
    icon: FileText,
    content: {
      headline: "You're Invited",
      subheadline: "Join us for a celebration",
      body: "We would be honored to have you at our special event."
    }
  },
  {
    id: "details",
    name: "Details",
    icon: Calendar,
    content: {
      headline: "Event Details",
      date: "June 15, 2026",
      time: "6:00 PM",
      location: "The Grand Venue, 123 Main Street",
      body: "Please join us for an evening of celebration, food, and wonderful company."
    }
  },
  {
    id: "rsvp",
    name: "RSVP",
    icon: MessageSquare,
    content: {
      headline: "RSVP",
      subheadline: "Let us know if you can make it",
      fields: [
        { label: "Full Name", type: "text", required: true },
        { label: "Email", type: "email", required: true },
        { label: "Number of Guests", type: "number", required: true },
        { label: "Dietary Requirements", type: "textarea", required: false }
      ],
      buttons: [{ label: "Submit RSVP", action: "submit" }]
    }
  }
]

const starterTemplates: Record<string, StarterTemplate> = {
  birthday: {
    title: "Birthday Party",
    pages: [
      {
        id: "cover",
        name: "Cover",
        icon: FileText,
        content: {
          headline: "You're Invited to a Birthday Bash",
          subheadline: "Cake, music, and great company",
          body: "Come celebrate with us for an evening full of fun, laughter, and birthday magic."
        }
      },
      {
        id: "details",
        name: "Details",
        icon: Calendar,
        content: {
          headline: "Party Details",
          date: "Saturday, August 21, 2026",
          time: "5:30 PM",
          location: "Sunset Rooftop Lounge",
          body: "Dress festive and bring your best party energy."
        }
      },
      {
        id: "schedule",
        name: "Schedule",
        icon: Clock,
        content: {
          headline: "Evening Flow",
          items: [
            { icon: "door-open", label: "Doors Open", value: "5:30 PM" },
            { icon: "cake", label: "Cake Moment", value: "7:00 PM" },
            { icon: "music", label: "Dance Floor", value: "7:30 PM" }
          ]
        }
      },
      {
        id: "location",
        name: "Location",
        icon: MapPin,
        content: {
          headline: "Find Us",
          location: "Sunset Rooftop Lounge, 128 Harbor Ave",
          body: "Street parking is available nearby, and the entrance is on Harbor Ave."
        }
      },
      {
        id: "rsvp",
        name: "RSVP",
        icon: MessageSquare,
        content: {
          headline: "RSVP",
          subheadline: "Save your spot at the party",
          fields: [
            { label: "Full Name", type: "text", required: true },
            { label: "Email", type: "email", required: true },
            { label: "Number of Guests", type: "number", required: true }
          ],
          buttons: [{ label: "Confirm Attendance", action: "submit" }]
        }
      }
    ]
  },
  wedding: {
    title: "Wedding Invitation",
    pages: [
      {
        id: "cover",
        name: "Cover",
        icon: FileText,
        content: {
          headline: "Together With Their Families",
          subheadline: "Invite you to celebrate their wedding",
          body: "Join us as we begin our next chapter and celebrate love with those closest to us."
        }
      },
      {
        id: "details",
        name: "Ceremony",
        icon: Calendar,
        content: {
          headline: "Ceremony Details",
          date: "Saturday, September 18, 2026",
          time: "4:00 PM",
          location: "Rosewood Estate Gardens",
          body: "Reception to follow immediately after the ceremony."
        }
      },
      {
        id: "schedule",
        name: "Schedule",
        icon: Clock,
        content: {
          headline: "Wedding Day Timeline",
          items: [
            { icon: "rings", label: "Ceremony", value: "4:00 PM" },
            { icon: "camera", label: "Photos", value: "5:00 PM" },
            { icon: "glass", label: "Reception", value: "6:00 PM" }
          ]
        }
      },
      {
        id: "location",
        name: "Venue",
        icon: MapPin,
        content: {
          headline: "Venue & Parking",
          location: "Rosewood Estate, 420 Willow Lane",
          body: "Complimentary valet and a shuttle service from downtown hotels are available."
        }
      },
      {
        id: "registry",
        name: "Registry",
        icon: Gift,
        content: {
          headline: "Registry",
          body: "Your presence means everything. For those who wish, our registry links are available below."
        }
      },
      {
        id: "rsvp",
        name: "RSVP",
        icon: MessageSquare,
        content: {
          headline: "RSVP",
          subheadline: "Kindly respond by August 20",
          fields: [
            { label: "Full Name", type: "text", required: true },
            { label: "Email", type: "email", required: true },
            { label: "Meal Preference", type: "text", required: false }
          ],
          buttons: [{ label: "Send RSVP", action: "submit" }]
        }
      }
    ]
  },
  corporate: {
    title: "Corporate Event",
    pages: [
      {
        id: "cover",
        name: "Cover",
        icon: FileText,
        content: {
          headline: "You're Invited",
          subheadline: "Corporate Networking Event",
          body: "Connect with industry leaders, partners, and peers for an evening of insights and opportunities."
        }
      },
      {
        id: "details",
        name: "Details",
        icon: Calendar,
        content: {
          headline: "Event Details",
          date: "Thursday, October 7, 2026",
          time: "6:00 PM",
          location: "Downtown Convention Hall",
          body: "Business casual attire recommended."
        }
      },
      {
        id: "schedule",
        name: "Agenda",
        icon: Clock,
        content: {
          headline: "Agenda",
          items: [
            { icon: "users", label: "Registration", value: "6:00 PM" },
            { icon: "mic", label: "Keynote", value: "6:45 PM" },
            { icon: "handshake", label: "Networking", value: "7:30 PM" }
          ]
        }
      },
      {
        id: "location",
        name: "Venue",
        icon: MapPin,
        content: {
          headline: "Venue Information",
          location: "Downtown Convention Hall, 88 Market Street",
          body: "On-site parking is available in Garage B."
        }
      },
      {
        id: "rsvp",
        name: "RSVP",
        icon: MessageSquare,
        content: {
          headline: "Confirm Attendance",
          subheadline: "Reserve your seat",
          fields: [
            { label: "Full Name", type: "text", required: true },
            { label: "Work Email", type: "email", required: true },
            { label: "Company", type: "text", required: true }
          ],
          buttons: [{ label: "Register", action: "submit" }]
        }
      }
    ]
  },
  baby: {
    title: "Baby Shower",
    pages: [
      {
        id: "cover",
        name: "Cover",
        icon: FileText,
        content: {
          headline: "A Little One Is On The Way",
          subheadline: "Join us for a baby shower celebration",
          body: "Let's celebrate this exciting new chapter with games, treats, and lots of love."
        }
      },
      {
        id: "details",
        name: "Details",
        icon: Calendar,
        content: {
          headline: "Shower Details",
          date: "Sunday, July 11, 2026",
          time: "1:00 PM",
          location: "The Garden House",
          body: "Light brunch and desserts will be served."
        }
      },
      {
        id: "schedule",
        name: "Plan",
        icon: Clock,
        content: {
          headline: "Event Plan",
          items: [
            { icon: "coffee", label: "Welcome Brunch", value: "1:00 PM" },
            { icon: "gift", label: "Gift Opening", value: "2:00 PM" },
            { icon: "camera", label: "Group Photos", value: "3:00 PM" }
          ]
        }
      },
      {
        id: "registry",
        name: "Registry",
        icon: Gift,
        content: {
          headline: "Baby Registry",
          body: "Your love and support mean the world. Registry details are included for anyone who asked."
        }
      },
      {
        id: "rsvp",
        name: "RSVP",
        icon: MessageSquare,
        content: {
          headline: "RSVP",
          subheadline: "Please reply by June 25",
          fields: [
            { label: "Full Name", type: "text", required: true },
            { label: "Email", type: "email", required: true },
            { label: "Will You Attend?", type: "text", required: true }
          ],
          buttons: [{ label: "Submit RSVP", action: "submit" }]
        }
      }
    ]
  },
  graduation: {
    title: "Graduation Celebration",
    pages: [
      {
        id: "cover",
        name: "Cover",
        icon: FileText,
        content: {
          headline: "Graduation Celebration",
          subheadline: "Celebrate this milestone with us",
          body: "Join us as we celebrate years of hard work, growth, and achievement."
        }
      },
      {
        id: "details",
        name: "Details",
        icon: Calendar,
        content: {
          headline: "Celebration Details",
          date: "Friday, May 29, 2026",
          time: "6:30 PM",
          location: "Riverfront Hall",
          body: "Ceremony recap and dinner celebration to follow."
        }
      },
      {
        id: "schedule",
        name: "Schedule",
        icon: Clock,
        content: {
          headline: "Evening Schedule",
          items: [
            { icon: "school", label: "Welcome Toast", value: "6:45 PM" },
            { icon: "utensils", label: "Dinner", value: "7:15 PM" },
            { icon: "music", label: "Celebration", value: "8:00 PM" }
          ]
        }
      },
      {
        id: "gallery",
        name: "Gallery",
        icon: ImageIcon,
        content: {
          headline: "Memory Lane",
          subheadline: "Highlights from the journey"
        }
      },
      {
        id: "rsvp",
        name: "RSVP",
        icon: MessageSquare,
        content: {
          headline: "RSVP",
          subheadline: "We'd love to celebrate with you",
          fields: [
            { label: "Full Name", type: "text", required: true },
            { label: "Email", type: "email", required: true },
            { label: "Guest Count", type: "number", required: true }
          ],
          buttons: [{ label: "Confirm", action: "submit" }]
        }
      }
    ]
  },
  social: {
    title: "Social Gathering",
    pages: [
      {
        id: "cover",
        name: "Cover",
        icon: FileText,
        content: {
          headline: "Let's Get Together",
          subheadline: "An evening to connect and unwind",
          body: "Good people, good conversation, and a relaxed vibe. Hope to see you there."
        }
      },
      {
        id: "details",
        name: "Details",
        icon: Calendar,
        content: {
          headline: "Gathering Details",
          date: "Saturday, June 12, 2026",
          time: "7:00 PM",
          location: "City Terrace Lounge",
          body: "Feel free to bring a friend and stay as long as you'd like."
        }
      },
      {
        id: "location",
        name: "Location",
        icon: MapPin,
        content: {
          headline: "Where To Meet",
          location: "City Terrace Lounge, 15 Park View",
          body: "Closest transit stop: Park View Station."
        }
      },
      {
        id: "faq",
        name: "FAQ",
        icon: MessageSquare,
        content: {
          headline: "Quick Notes",
          subheadline: "Casual dress, open seating, no formal agenda"
        }
      },
      {
        id: "rsvp",
        name: "RSVP",
        icon: MessageSquare,
        content: {
          headline: "RSVP",
          subheadline: "Let us know if you're coming",
          fields: [
            { label: "Full Name", type: "text", required: true },
            { label: "Email", type: "email", required: true },
            { label: "Bringing Anyone?", type: "text", required: false }
          ],
          buttons: [{ label: "Save My Spot", action: "submit" }]
        }
      }
    ]
  }
}

function getStarterTemplateFromPrompt(prompt: string): StarterTemplate | undefined {
  const normalizedPrompt = prompt.trim().toLowerCase()
  if (!normalizedPrompt) return undefined

  if (normalizedPrompt.includes("birthday")) return starterTemplates.birthday
  if (normalizedPrompt.includes("wedding")) return starterTemplates.wedding
  if (normalizedPrompt.includes("corporate")) return starterTemplates.corporate
  if (normalizedPrompt.includes("baby")) return starterTemplates.baby
  if (normalizedPrompt.includes("graduation")) return starterTemplates.graduation
  if (normalizedPrompt.includes("social")) return starterTemplates.social

  return undefined
}

function cloneInvitationElements(elements?: InvitationElement[]): InvitationElement[] | undefined {
  if (!elements) return undefined

  return elements.map((element) => ({
    ...element,
    content: element.content ? { ...element.content } : undefined,
    style: element.style ? { ...element.style } : undefined,
    children: cloneInvitationElements(element.children),
  }))
}

function clonePages(pages: InvitePage[]): InvitePage[] {
  return pages.map((page) => ({
    ...page,
    content: {
      ...page.content,
      buttons: page.content.buttons ? page.content.buttons.map((button) => ({ ...button })) : undefined,
      fields: page.content.fields ? page.content.fields.map((field) => ({ ...field })) : undefined,
      items: page.content.items ? page.content.items.map((item) => ({ ...item })) : undefined,
      elements: cloneInvitationElements(page.content.elements),
      images: page.content.images ? [...page.content.images] : undefined,
    },
  }))
}

const availablePageTypes = [
  { id: "cover", name: "Cover Page", icon: FileText },
  { id: "details", name: "Event Details", icon: Calendar },
  { id: "rsvp", name: "RSVP Form", icon: MessageSquare },
  { id: "location", name: "Location & Map", icon: MapPin },
  { id: "schedule", name: "Schedule", icon: Clock },
  { id: "gallery", name: "Photo Gallery", icon: ImageIcon },
  { id: "gifts", name: "Gift Registry", icon: Gift },
  { id: "faq", name: "FAQ", icon: MessageSquare },
]

export default function EditorPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialPrompt = searchParams.get("prompt") || ""
  const starterTemplate = getStarterTemplateFromPrompt(initialPrompt)
  const eventParam = searchParams.get("event")
  const projectParam = searchParams.get("project")
  const draftEventIdRef = useRef<string>("")
  const draftIdAppliedRef = useRef(false)
  if (!draftEventIdRef.current) {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      draftEventIdRef.current = crypto.randomUUID()
    } else {
      draftEventIdRef.current = `draft-${Date.now()}`
    }
  }
  const currentEventId = eventParam?.trim() || projectParam?.trim() || draftEventIdRef.current
  const currentInvitation = getInvitationById(eventParam ?? projectParam ?? defaultInvitationId)
  const starterPages = clonePages(starterTemplate?.pages ?? defaultPages)
  const assistantName = "Aria Voss"

  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [pages, setPages] = useState<InvitePage[]>(starterPages)
  const [activePage, setActivePage] = useState<string>("cover")
  const [eventTitle, setEventTitle] = useState<string>(starterTemplate?.title ?? currentInvitation.title)
  const initialVersionId = `v${Date.now()}`
  const [versions, setVersions] = useState<Version[]>([
    { id: initialVersionId, label: initialVersionId, timestamp: new Date(), pages: starterPages }
  ])
  const [activeVersion, setActiveVersion] = useState(initialVersionId)
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop")
  const [showPagePanel, setShowPagePanel] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [attachedImages, setAttachedImages] = useState<Array<{ name: string, preview: string }>>([])
  const [isDraggingImages, setIsDraggingImages] = useState(false)
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle")
  const [eventStatus, setEventStatus] = useState<"draft" | "published" | "completed" | "cancelled">("draft")
  const [authToken, setAuthToken] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [isLoadingDraft, setIsLoadingDraft] = useState(true)
  const [isDraftImagesLoaded, setIsDraftImagesLoaded] = useState(false)
  const [brandSettings, setBrandSettings] = useState<any>(null)
  const brandAppliedRef = useRef(false)
  const initialPromptSentRef = useRef(false)
  const imageInputRef = useRef<HTMLInputElement | null>(null)
  const dragDepthRef = useRef(0)

  const toAiImages = (images: Array<{ name: string; preview: string }>) => {
    return images
      .map((image) => {
        const match = image.preview.match(/^data:([^;]+);base64,(.*)$/)
        if (!match) {
          return null
        }

        return {
          name: image.name,
          type: match[1],
          data: match[2],
        }
      })
      .filter((image): image is StoredDraftImage => image !== null)
  }

  const resolveAuthToken = async () => {
    if (authToken) {
      return authToken
    }

    const currentUser = auth.currentUser
    if (!currentUser) {
      return null
    }

    try {
      const token = await currentUser.getIdToken()
      setAuthToken(token)
      setUserId(currentUser.uid)
      return token
    } catch (error) {
      console.error("Failed to resolve auth token:", error)
      return null
    }
  }

  useEffect(() => {
    if (eventParam?.trim() || projectParam?.trim() || draftIdAppliedRef.current) return
    draftIdAppliedRef.current = true

    const nextParams = new URLSearchParams(searchParams.toString())
    nextParams.set("event", currentEventId)
    router.replace(`/editor?${nextParams.toString()}`)
  }, [currentEventId, eventParam, projectParam, router, searchParams])

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    const draftKey = eventParam?.trim() || currentEventId
    const storedImages = draftKey ? sessionStorage.getItem(`invyra-draft-images:${draftKey}`) : null

    if (!storedImages) {
      setIsDraftImagesLoaded(true)
      return
    }

    try {
      const parsed = JSON.parse(storedImages) as StoredDraftImage[]
      const nextImages = parsed
        .filter((image) => image?.data)
        .map((image) => ({
          name: image.name,
          preview: image.data,
        }))

      if (nextImages.length > 0) {
        setAttachedImages((prev) => (prev.length > 0 ? prev : nextImages))
      }

      sessionStorage.removeItem(`invyra-draft-images:${draftKey}`)
    } catch (error) {
      console.error("Failed to load draft images:", error)
    } finally {
      setIsDraftImagesLoaded(true)
    }
  }, [currentEventId, eventParam])

  // Initialize with prompt if provided
  useEffect(() => {
    if (initialPrompt) {
      const welcomeMessage: Message = {
        id: "welcome",
        role: "assistant",
        content: starterTemplate
          ? `I'm ${assistantName}. I already set up a tailored multi-page starter for "${starterTemplate.title}" with prefilled sections. Tell me what you'd like to refine first.`
          : `I'm ${assistantName}. I'll help you shape "${initialPrompt}" into something more intentional. I started with a multi-page invitation, and we can make the cover, details, and RSVP feel more alive from here.`,
        timestamp: new Date()
      }
      setMessages([welcomeMessage])
    } else {
      const welcomeMessage: Message = {
        id: "welcome",
        role: "assistant",
        content: `I'm ${assistantName}, your creative design partner. Let's make this feel more alive - you can describe changes, ask for a new page, or push the visual rhythm in a bolder direction.`,
        timestamp: new Date()
      }
      setMessages([welcomeMessage])
    }
  }, [assistantName, initialPrompt, starterTemplate])

  // Set up auth token and load draft
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const token = await user.getIdToken()
          setAuthToken(token)
          setUserId(user.uid)

          // Try to load draft from database
          const response = await fetch("/api/editor/load", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
              eventId: currentEventId,
              userId: user.uid
            })
          })

          if (response.ok) {
            const data = await response.json()
            if (typeof data.event.status === "string") {
              setEventStatus(data.event.status)
            }
            // set title if present
            if (data.event.title && typeof data.event.title === "string") {
              setEventTitle(data.event.title)
            }
            // set pages if present
            if (data.event.pages && Array.isArray(data.event.pages) && data.event.pages.length > 0) {
              setPages(data.event.pages as InvitePage[])
              if (data.event.pages.length > 0) {
                setActivePage(data.event.pages[0].id)
              }
              const loadedVersionId = `v${Date.now()}`
              const firstVersion: Version = {
                id: loadedVersionId,
                label: loadedVersionId,
                timestamp: new Date(data.event.updatedAt),
                pages: data.event.pages as InvitePage[]
              }
              setVersions([firstVersion])
              setActiveVersion(loadedVersionId)
            }
            // set chat messages if present
            if (data.event.messages && Array.isArray(data.event.messages)) {
              try {
                // normalize timestamps to Date objects
                const msgs = data.event.messages.map((m: any) => ({
                  id: m.id,
                  role: m.role,
                  content: m.content,
                  timestamp: m.timestamp ? new Date(m.timestamp) : new Date(),
                  images: m.images ?? []
                }))
                setMessages(msgs)
              } catch (err) {
                console.warn("Failed to parse saved messages", err)
              }
            }
          } else {
            // Event doesn't exist or error loading - use defaults
            console.warn("No saved draft found, using defaults")
          }
        } catch (error) {
          console.error("Error checking for draft:", error)
        } finally {
          setIsLoadingDraft(false)
        }
      } else {
        setIsLoadingDraft(false)
      }
    })

    return () => unsubscribe()
  }, [currentEventId])

  // Load brand settings when user ID is available
  useEffect(() => {
    if (!userId) return

    const loadBrand = async () => {
      try {
        const brand = await getUserBranding(userId)
        setBrandSettings(brand)
      } catch (error) {
        console.error("Error loading brand settings:", error)
      }
    }

    loadBrand()
  }, [userId])

  // Apply brand settings to initial pages (only once, when brand settings are loaded)
  useEffect(() => {
    if (!brandSettings || brandAppliedRef.current || pages.length === 0) return
    if (isLoadingDraft) return // Wait for draft to finish loading

    // Check if this is a new invitation (not loaded from database)
    // If pages were loaded from database, don't override with brand settings
    const isLoadedFromDatabase = pages.length > 0 &&
      pages.some(p => p.content?.headline && p.content.headline !== "You're Invited" &&
        p.content.headline !== "Together With Their Families" &&
        p.content.headline !== "You're Invited to a Birthday Bash")

    if (!isLoadedFromDatabase && Object.keys(brandSettings).length > 0) {
      brandAppliedRef.current = true
      const brandedPages = applyBrandSettingsToPages(pages, brandSettings)
      setPages(brandedPages)

      // Also update the version history
      setVersions(prevVersions =>
        prevVersions.map(v => ({
          ...v,
          pages: v.pages === pages ? brandedPages : v.pages
        }))
      )
    }
  }, [brandSettings, isLoadingDraft, pages])

  // Send initial prompt to AI if provided and not yet sent (only after draft loading completes)
  useEffect(() => {
    // Early exit if conditions aren't met
    // Only proceed if we have everything we need
    if (!initialPrompt) {
      return
    }

    if (initialPromptSentRef.current) {
      return
    }

    // Wait for draft to finish loading before checking messages
    if (isLoadingDraft) {
      return
    }

    if (!isDraftImagesLoaded) {
      return
    }

    // Auth must be ready
    if (!authToken) {
      return
    }

    // Check if the initial prompt was already sent in a previous session
    // Check if the initial prompt was already sent in a previous session
    // by looking for a message with the exact same content
    const initialPromptSentKey = `invyra-initial-prompt-sent:${currentEventId}`
    const initialPromptAlreadySent = typeof window !== "undefined"
      && sessionStorage.getItem(initialPromptSentKey) === "true"

    if (initialPromptAlreadySent) {
      initialPromptSentRef.current = true
      return
    }

    const hasInitialPrompt = messages.some(
      msg => msg.role === "user" && msg.content === initialPrompt
    )

    if (hasInitialPrompt) {
      // Prompt was already sent, don't send again
      initialPromptSentRef.current = true
      if (typeof window !== "undefined") {
        sessionStorage.setItem(initialPromptSentKey, "true")
      }
      return
    }

    // All clear, mark as sent and prepare to send
    initialPromptSentRef.current = true

    const sendInitialPrompt = async () => {
      if (typeof window !== "undefined") {
        sessionStorage.setItem(initialPromptSentKey, "true")
      }

      const imageDataUrls = attachedImages.map((image) => image.preview)
      const userMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content: initialPrompt,
        images: imageDataUrls.length > 0 ? imageDataUrls : undefined,
        timestamp: new Date()
      }

      // Use current state from closure at time of effect execution
      const conversation = [...messages, userMessage]
      setMessages(conversation)
      setIsTyping(true)

      let nextPages = pages
      let nextActivePage = activePage
      let didMutate = false

      const imageInsertion = attachImagesToInvitation(nextPages, imageDataUrls)
      if (imageInsertion.didMutate) {
        nextPages = imageInsertion.pages
        nextActivePage = imageInsertion.activePageId ?? nextActivePage
        didMutate = true
      }

      try {
        const response = await fetch("/api/editor/ai", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            prompt: initialPrompt,
            invitation: {
              id: currentEventId,
              title: currentInvitation.title,
              description: currentInvitation.description,
            },
            activePage: nextActivePage,
            pages: nextPages.map(({ id, name, content }) => ({ id, name, content })),
            images: imageDataUrls.length > 0 ? toAiImages(attachedImages) : undefined,
            recentMessages: conversation.slice(-8).map(({ role, content }) => ({ role, content })),
          }),
        })

        if (!response.ok && response.status !== 204) {
          throw new Error("AI request failed")
        }

        if (response.status === 204) {
          const fallback = generateFallbackAIResponse(initialPrompt)
          setMessages(prev => [...prev, fallback])
          return
        }

        const data = (await response.json()) as AiEditorResponse
        const reply = data.reply?.trim() || "I took a pass at that and shaped the invitation with a clearer visual rhythm."
        const assistantMessage: Message = {
          id: Date.now().toString(),
          role: "assistant",
          content: reply,
          timestamp: new Date(),
        }

        let responsePages = nextPages
        let responseActivePage = nextActivePage
        let responseDidMutate = didMutate

        if (data.actions?.length) {
          const applied = applyAiActions(data.actions, nextPages)
          responsePages = applied.pages
          responseActivePage = applied.activePageId ?? nextActivePage
          responseDidMutate = applied.didMutate || responseDidMutate
        }

        setMessages(prev => [...prev, assistantMessage])

        if (responseDidMutate) {
          setPages(responsePages)
          setActivePage(responseActivePage)

          const nextVersionId = `v${versions.length + 1}`
          const newVersion: Version = {
            id: nextVersionId,
            label: nextVersionId,
            timestamp: new Date(),
            pages: responsePages,
          }
          setVersions(prev => [...prev, newVersion])
          setActiveVersion(nextVersionId)
        }
      } catch (error) {
        console.error("Error sending initial prompt:", error)
        const response = generateFallbackAIResponse(initialPrompt)
        setMessages(prev => [...prev, response])
      } finally {
        setAttachedImages([])
        setIsTyping(false)
      }
    }

    sendInitialPrompt()
  }, [attachedImages, initialPrompt, isDraftImagesLoaded, isLoadingDraft, authToken, messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    dragDepthRef.current = 0
    setIsDraggingImages(false)

    handleComposerFiles(e.dataTransfer.files)
  }

  const removeImage = (index: number) => {
    setAttachedImages(prev => {
      return prev.filter((_, i) => i !== index)
    })
  }

  const attachImagesToInvitation = (currentPages: InvitePage[], imageDataUrls: string[]) => {
    if (imageDataUrls.length === 0) {
      return {
        pages: currentPages,
        activePageId: undefined as string | undefined,
        didMutate: false,
      }
    }

    const nextPages = [...currentPages]
    const galleryIndex = nextPages.findIndex((page) => page.id === "gallery" || page.id.startsWith("gallery-"))
    const currentGallery = galleryIndex >= 0 ? nextPages[galleryIndex] : null
    const nextImages = [...(currentGallery?.content.images ?? []), ...imageDataUrls]

    if (currentGallery) {
      nextPages[galleryIndex] = {
        ...currentGallery,
        content: {
          ...currentGallery.content,
          images: nextImages,
        },
      }

      return {
        pages: nextPages,
        activePageId: currentGallery.id,
        didMutate: true,
      }
    }

    const newGalleryPage: InvitePage = {
      id: `gallery-${Date.now()}-${nextPages.length}`,
      name: "Photo Gallery",
      icon: ImageIcon,
      content: {
        ...getDefaultContentForPageType("gallery"),
        images: nextImages,
      },
    }

    return {
      pages: [...nextPages, newGalleryPage],
      activePageId: newGalleryPage.id,
      didMutate: true,
    }
  }

  const handleComposerFiles = (files: FileList | File[]) => {
    const imageFiles = Array.from(files).filter((file) => file.type.startsWith("image/"))

    imageFiles.forEach((file) => {
      const reader = new FileReader()
      reader.onload = (event) => {
        const preview = event.target?.result as string
        setAttachedImages((prev) => [...prev, { name: file.name, preview }])
      }
      reader.readAsDataURL(file)
    })
  }

  const handlePromptInsert = (prompt: string) => {
    setInputValue((current) => {
      const next = current.trim()
      return next ? `${next} ${prompt}` : prompt
    })
  }

  const commitVersion = (nextPages: InvitePage[], nextActivePage?: string) => {
    const nextVersionId = `v${Date.now()}`
    const resolvedActivePage = nextActivePage ?? nextPages[0]?.id ?? activePage

    setPages(nextPages)
    setActivePage(resolvedActivePage)
    setVersions((prev) => [...prev, {
      id: nextVersionId,
      label: nextVersionId,
      timestamp: new Date(),
      pages: nextPages,
    }])
    setActiveVersion(nextVersionId)
  }

  const loadVersion = (versionId: string) => {
    const versionIndex = versions.findIndex((version) => version.id === versionId)
    if (versionIndex === -1) {
      return
    }

    const version = versions[versionIndex]
    setPages(version.pages)
    setActiveVersion(version.id)
    setActivePage((current) => version.pages.some((page) => page.id === current) ? current : (version.pages[0]?.id ?? current))
  }

  const handleUndo = () => {
    const activeIndex = versions.findIndex((version) => version.id === activeVersion)
    if (activeIndex <= 0) {
      return
    }

    loadVersion(versions[activeIndex - 1].id)
  }

  const handleRedo = () => {
    const activeIndex = versions.findIndex((version) => version.id === activeVersion)
    if (activeIndex === -1 || activeIndex >= versions.length - 1) {
      return
    }

    loadVersion(versions[activeIndex + 1].id)
  }

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!authToken || !userId) return

      setSaveStatus("saving")
      try {
        await fetch("/api/editor/save", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${authToken}`
          },
          body: JSON.stringify({
            invitationId: currentEventId,
            userId: userId,
            title: eventTitle,
            pages: pages.map(({ id, name, content }) => ({ id, name, content })),
            brand: brandSettings,
            messages: messages.map(({ id, role, content: msgContent, timestamp, images }) => ({ id, role, content: msgContent, timestamp, images }))
          }),
        })
        setSaveStatus("saved")
        setTimeout(() => setSaveStatus("idle"), 2000)
      } catch (error) {
        console.error("Failed to save:", error)
        setSaveStatus("error")
      }
    }, 1000)
    return () => clearTimeout(timer)
  }, [eventTitle, messages, pages, currentEventId, authToken, userId])

  const handleSendMessage = async () => {
    const prompt = inputValue.trim()
    const hasImages = attachedImages.length > 0
    if (!prompt && !hasImages || isTyping) return

    const imageDataUrls = attachedImages.map((image) => image.preview)

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: prompt,
      images: hasImages ? imageDataUrls : undefined,
      timestamp: new Date()
    }

    const conversation = [...messages, userMessage]

    setMessages(conversation)
    setInputValue("")
    setIsTyping(true)

    let nextPages = pages
    let nextActivePage = activePage
    let didMutate = false

    const imageInsertion = attachImagesToInvitation(nextPages, imageDataUrls)
    if (imageInsertion.didMutate) {
      nextPages = imageInsertion.pages
      nextActivePage = imageInsertion.activePageId ?? nextActivePage
      didMutate = true
    }

    const token = await resolveAuthToken()
    if (!token) {
      setMessages(prev => [...prev, {
        id: `${Date.now()}-auth`,
        role: "assistant",
        content: "I can't reach the AI yet because your session isn't ready. Give it a moment and try again.",
        timestamp: new Date(),
      }])
      setIsTyping(false)
      return
    }

    try {
      const response = await fetch("/api/editor/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          prompt,
          invitation: {
            id: currentEventId,
            title: currentInvitation.title,
            description: currentInvitation.description,
          },
          activePage: nextActivePage,
          pages: nextPages.map(({ id, name, content }) => ({ id, name, content })),
          images: hasImages ? toAiImages(attachedImages) : undefined,
          recentMessages: conversation.slice(-8).map(({ role, content }) => ({ role, content })),
        }),
      })

      if (!response.ok && response.status !== 204) {
        throw new Error("AI request failed")
      }

      if (response.status === 204) {
        const response = generateFallbackAIResponse(prompt)
        setMessages(prev => [...prev, response])
        return
      }

      const data = (await response.json()) as AiEditorResponse
      const reply = data.reply?.trim() || "I took a pass at that and shaped the invitation with a clearer visual rhythm."
      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: reply,
        timestamp: new Date(),
      }

      let responsePages = nextPages
      let responseActivePage = nextActivePage
      let responseDidMutate = didMutate

      if (data.actions?.length) {
        const applied = applyAiActions(data.actions, nextPages)
        responsePages = applied.pages
        responseActivePage = applied.activePageId ?? nextActivePage
        responseDidMutate = applied.didMutate || responseDidMutate
      }

      setMessages(prev => [...prev, assistantMessage])

      if (responseDidMutate) {
        setPages(responsePages)
        setActivePage(responseActivePage)

        commitVersion(responsePages, responseActivePage)
      }
    } catch {
      const response = generateFallbackAIResponse(prompt)
      setMessages(prev => [...prev, response])
    } finally {
      setAttachedImages([])
      setIsTyping(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const addPage = (pageType: typeof availablePageTypes[0]) => {
    const newPage: InvitePage = {
      id: `${pageType.id}-${Date.now()}`,
      name: pageType.name,
      icon: pageType.icon,
      content: getDefaultContentForPageType(pageType.id)
    }
    setPages(prev => [...prev, newPage])
    setActivePage(newPage.id)
  }

  const buildPreviewData = () => {
    const coverPage = pages.find(p => p.id === 'cover' || p.id.startsWith('cover-'))
    const coverHeadline = (coverPage?.content as any)?.headline
    return {
    id: currentEventId,
    title: eventTitle || coverHeadline || currentInvitation.title,
    theme: {
      primaryColor: "from-accent via-primary to-chart-3",
      backgroundColor: "bg-card",
    },
    brand: brandSettings,
    pages: pages.map((page) => ({
      id: page.id,
      type: page.id.split("-")[0],
      content: page.content,
    })),
  }}

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    localStorage.setItem("invyra-preview-data", JSON.stringify(buildPreviewData()))
  }, [currentEventId, eventTitle, brandSettings, pages])

  const handlePreview = () => {
    router.push("/preview")
  }

  const removePage = (pageId: string) => {
    if (pages.length <= 1) return
    const nextPages = pages.filter((page) => page.id !== pageId)
    commitVersion(nextPages, activePage === pageId ? nextPages[0]?.id : activePage)
  }

  const currentPage = pages.find(p => p.id === activePage) || pages[0]

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col bg-background">
      {/* Top bar */}
      <div className="h-12 border-b border-border/50 flex items-center justify-between px-4 bg-card/50">
        <div className="flex items-center gap-3">
          <Link href="/home" className="text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </Link>

          {/* Editable title */}
          <div className="flex items-center gap-3">
            <input
              value={eventTitle}
              onChange={(e) => setEventTitle(e.target.value)}
              placeholder="Untitled Event"
              aria-label="Event title"
              className="w-64 max-w-[40vw] truncate bg-card/10 border border-border/50 rounded-md px-2 py-1 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* Undo/Redo */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleUndo}
              disabled={versions.findIndex((version) => version.id === activeVersion) <= 0}
            >
              <Undo2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleRedo}
              disabled={versions.findIndex((version) => version.id === activeVersion) >= versions.length - 1}
            >
              <Redo2 className="w-4 h-4" />
            </Button>
          </div>

            {/* Save status indicator */}
            <div className="flex items-center gap-2 min-w-[92px]">
              {saveStatus === "saving" && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                  Saving...
                </div>
              )}
              {saveStatus === "saved" && (
                <div className="flex items-center gap-1 text-xs text-green-500">
                  <Check className="w-3.5 h-3.5" />
                  Saved
                </div>
              )}
              {saveStatus === "error" && (
                <div className="flex items-center gap-1 text-xs text-red-500">
                  <span>Save failed</span>
                </div>
              )}
            </div>
          </div>

        <div className="flex items-center gap-2">
          {/* Preview mode toggle */}
          <div className="flex items-center bg-secondary rounded-lg p-0.5">
            <Button
              variant={previewMode === "desktop" ? "secondary" : "ghost"}
              size="icon"
              className="h-7 w-7"
              onClick={() => setPreviewMode("desktop")}
            >
              <Monitor className="w-4 h-4" />
            </Button>
            <Button
              variant={previewMode === "mobile" ? "secondary" : "ghost"}
              size="icon"
              className="h-7 w-7"
              onClick={() => setPreviewMode("mobile")}
            >
              <Smartphone className="w-4 h-4" />
            </Button>
          </div>

          <div className="w-px h-5 bg-border" />

          <Button variant="ghost" size="sm" onClick={handlePreview}>
            <Eye className="w-4 h-4 mr-1.5" />
            Preview
          </Button>

          <Button
            size="sm"
            className="gradient-primary border-0 text-white"
            disabled={eventStatus === "published"}
            onClick={async () => {
              if (eventStatus === "published") {
                return
              }

              if (!authToken || !userId) return
              try {
                const response = await fetch("/api/editor/publish", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${authToken}`
                  },
                  body: JSON.stringify({
                    eventId: currentEventId,
                    userId: userId
                  })
                })
                if (response.ok) {
                  const data = await response.json().catch(() => ({}))
                  const eventId = data.eventId ?? currentEventId
                  setEventStatus("published")
                  if (typeof window !== "undefined") {
                    localStorage.setItem("invyra-last-published-event-id", eventId)
                  }
                  const title = eventTitle ?? currentInvitation.title ?? "Untitled Event"
                  const pagesCount = pages.length
                  const detailsPage = pages.find((page) => page.content.date || page.content.time) ?? currentPage
                  const nextParams = new URLSearchParams()
                  nextParams.set("event", eventId)
                  nextParams.set("title", title)
                  nextParams.set("pages", String(pagesCount))

                  if (detailsPage?.content?.date) {
                    nextParams.set("date", detailsPage.content.date)
                  }

                  if (detailsPage?.content?.time) {
                    nextParams.set("time", detailsPage.content.time)
                  }

                  router.push(`/publish/confirm?${nextParams.toString()}`)
                }
              } catch (error) {
                console.error("Failed to publish:", error)
              }
            }}
          >
            {eventStatus === "published" ? "Published" : "Publish"}
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left panel - Chat */}
        <div
          className={`relative w-[400px] flex flex-col border-r border-border/50 bg-card/30 ${isDraggingImages ? "bg-primary/5" : ""}`}
          onDragEnter={(e) => {
            e.preventDefault()
            e.stopPropagation()
            dragDepthRef.current += 1
            setIsDraggingImages(true)
          }}
          onDragOver={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setIsDraggingImages(true)
          }}
          onDragLeave={(e) => {
            e.preventDefault()
            e.stopPropagation()
            dragDepthRef.current = Math.max(0, dragDepthRef.current - 1)
            if (dragDepthRef.current === 0) {
              setIsDraggingImages(false)
            }
          }}
          onDrop={handleDrop}
        >
          {isDraggingImages && (
            <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-background/70 backdrop-blur-sm">
              <div className="rounded-2xl border border-border/60 bg-card px-4 py-3 text-sm text-muted-foreground shadow-lg">
                Drop images here to attach them to the chat
              </div>
            </div>
          )}
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[90%]`}>
                  {message.role === "assistant" && (
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-lg gradient-primary flex items-center justify-center">
                        <Sparkles className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-xs text-muted-foreground">Aria Voss</span>
                    </div>
                  )}
                  <div className={`rounded-2xl px-4 py-3 ${message.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-secondary rounded-bl-sm"
                    }`}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                    {message.images && message.images.length > 0 && (
                      <div className="mt-3 grid grid-cols-3 gap-2">
                          {message.images.map((img, i) => (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              key={i}
                              src={img}
                              alt={`${message.role}-attachment-${i}`}
                              className="w-full h-20 object-cover rounded-md bg-white"
                            />
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-lg gradient-primary flex items-center justify-center shrink-0">
                  <Sparkles className="w-3 h-3 text-white" />
                </div>
                <div className="bg-secondary rounded-2xl rounded-bl-sm px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-border/50">
            <div className={`relative bg-secondary rounded-xl p-3 ${isDraggingImages ? "ring-2 ring-primary/60 ring-offset-2 ring-offset-background" : ""}`}>
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe changes to your invitation..."
                rows={2}
                className="w-full bg-transparent px-1 pt-0 pb-3 text-sm resize-none focus:outline-none placeholder:text-muted-foreground/60"
              />
              {attachedImages.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {attachedImages.map((image, index) => (
                    <div key={`${image.name}-${index}`} className="relative h-10 w-10 rounded-md overflow-hidden border border-border/50 bg-background">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={image.preview} alt={image.name} className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-background border border-border/50 text-[10px] leading-none"
                        aria-label={`Remove ${image.name}`}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-center justify-between gap-2 border-t border-border/50 pt-3">
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground"
                    onClick={() => handlePromptInsert("Focus on the color palette and visual mood.")}
                    aria-label="Suggest palette changes"
                  >
                    <Palette className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground"
                    onClick={() => handlePromptInsert("Refine the typography hierarchy and spacing.")}
                    aria-label="Suggest typography changes"
                  >
                    <Type className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground"
                    onClick={() => imageInputRef.current?.click()}
                    aria-label="Attach an image"
                  >
                    <ImageIcon className="w-4 h-4" />
                  </Button>
                </div>
                <Button
                  size="icon"
                  disabled={!inputValue.trim()}
                  onClick={handleSendMessage}
                  className={`h-7 w-7 rounded-lg ${inputValue.trim()
                    ? "gradient-primary border-0 text-white"
                    : "bg-muted text-muted-foreground"
                    }`}
                >
                  <Send className="w-3.5 h-3.5" />
                </Button>
              </div>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.length) {
                    handleComposerFiles(e.target.files)
                  }
                  e.currentTarget.value = ""
                }}
              />
            </div>
          </div>
        </div>

        {/* Center - Preview with pages sidebar */}
        <div className="flex-1 flex overflow-hidden">
          {/* Pages sidebar */}
          {showPagePanel && (
            <div className="w-48 border-r border-border/50 bg-card/20 flex flex-col">
              <div className="p-3 border-b border-border/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs font-medium">Pages</span>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <Plus className="w-3.5 h-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    {availablePageTypes.map((pageType) => (
                      <DropdownMenuItem
                        key={pageType.id}
                        onClick={() => addPage(pageType)}
                      >
                        <pageType.icon className="w-4 h-4 mr-2 text-muted-foreground" />
                        {pageType.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {pages.map((page, index) => (
                  <div
                    key={page.id}
                    className={`group flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer transition-all ${activePage === page.id
                      ? "bg-primary/20 text-foreground"
                      : "hover:bg-secondary text-muted-foreground hover:text-foreground"
                      }`}
                    onClick={() => setActivePage(page.id)}
                  >
                    <GripVertical className="w-3 h-3 text-muted-foreground/50 cursor-grab" />
                    {page.icon ? (
                      <page.icon className="w-4 h-4 shrink-0" />
                    ) : (
                      <FileText className="w-4 h-4 shrink-0" />
                    )}
                    <span className="flex-1 text-xs truncate">{page.name}</span>
                    <span className="text-[10px] text-muted-foreground">{index + 1}</span>

                    {pages.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => { e.stopPropagation(); removePage(page.id); }}
                      >
                        <Trash2 className="w-3 h-3 text-destructive" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              {/* Page navigation */}
              <div className="p-2 border-t border-border/50 flex items-center justify-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  disabled={pages.findIndex(p => p.id === activePage) === 0}
                  onClick={() => {
                    const idx = pages.findIndex(p => p.id === activePage)
                    if (idx > 0) setActivePage(pages[idx - 1].id)
                  }}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-xs text-muted-foreground">
                  {pages.findIndex(p => p.id === activePage) + 1} / {pages.length}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  disabled={pages.findIndex(p => p.id === activePage) === pages.length - 1}
                  onClick={() => {
                    const idx = pages.findIndex(p => p.id === activePage)
                    if (idx < pages.length - 1) setActivePage(pages[idx + 1].id)
                  }}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Preview area */}
          <div className="flex-1 bg-[#0a0a12] overflow-hidden relative flex items-center justify-center p-8">
            {/* Toggle pages panel */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 left-4 h-8 w-8"
              onClick={() => setShowPagePanel(!showPagePanel)}
            >
              <Layers className="w-4 h-4" />
            </Button>

            {/* Preview container */}
            <div
              className={`transition-all duration-300 ${previewMode === "mobile"
                ? "w-[375px]"
                : "w-full max-w-lg"
                }`}
            >
              <InvitePagePreview page={currentPage} brand={brandSettings} />
            </div>


          </div>
        </div>
      </div>
    </div>
  )
}

// Invite page preview component
function InvitePagePreview({ page, brand }: { page: InvitePage; brand?: any }) {
  const { content } = page
  const customElements = [...(content.elements ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

  return (
    <div className="invitation-root bg-card rounded-2xl border border-border/50 overflow-hidden shadow-2xl" style={getInvitationBrandStyles(brand)}>
      {/* Page header themed by brand variables */}
      <div className="h-28 gradient-primary relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.1),transparent)]" />
      </div>

      {/* Content */}
      <div className="p-8 -mt-12 relative">
        {/* Icon badge */}
        <div className="w-14 h-14 mx-auto rounded-full bg-card border-4 border-card flex items-center justify-center shadow-lg mb-6">
          {page.icon ? (
            <page.icon className="w-5 h-5" style={{ color: 'var(--brand-primary, var(--primary))' }} />
          ) : (
            <FileText className="w-5 h-5" style={{ color: 'var(--brand-primary, var(--primary))' }} />
          )}
        </div>

        <div className="text-center space-y-6">
          {content.headline && typeof content.headline === "string" && (
            <h2 className="text-2xl font-semibold gradient-text">{content.headline}</h2>
          )}

          {content.subheadline && typeof content.subheadline === "string" && (
            <p className="text-sm text-muted-foreground">{content.subheadline}</p>
          )}

          {content.body && typeof content.body === "string" && (
            <p className="text-sm text-muted-foreground leading-relaxed">{content.body}</p>
          )}

          {/* Date/Time/Location */}
          {(content.date || content.time || content.location) && (
            <div className="space-y-3 py-4">
              {content.date && typeof content.date === "string" && (
                <div className="flex items-center justify-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span>{content.date}</span>
                </div>
              )}
              {content.time && typeof content.time === "string" && (
                <div className="flex items-center justify-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-accent" />
                  <span>{content.time}</span>
                </div>
              )}
              {content.location && typeof content.location === "string" && (
                <div className="flex items-center justify-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-chart-3" />
                  <span>{content.location}</span>
                </div>
              )}
            </div>
          )}

          {/* Form fields */}
          {content.fields && (
            <div className="space-y-3 text-left">
              {content.fields.map((field, index) => (
                <div key={index}>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    {field.label} {field.required && <span className="text-destructive">*</span>}
                  </label>
                  {field.type === "textarea" ? (
                    <textarea
                      className="w-full bg-secondary rounded-lg px-3 py-2 text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder={`Enter ${field.label.toLowerCase()}...`}
                    />
                  ) : (
                    <input
                      type={field.type}
                      className="w-full bg-secondary rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder={`Enter ${field.label.toLowerCase()}...`}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Buttons */}
          {content.buttons && (
            <div className="flex justify-center gap-3 pt-4">
              {content.buttons.map((button, index) => (
                <Button
                  key={index}
                  className="gradient-primary border-0 text-white"
                >
                  {button.label}
                </Button>
              ))}
            </div>
          )}

          {customElements.length > 0 && (
            <div className="pt-6 space-y-4 text-left">
              {customElements.map((element) => (
                <InvitationElementView key={element.id} element={element} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function InvitationElementView({ element }: { element: InvitationElement }) {
  const children = [...(element.children ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  const style = element.style ?? {}
  const content = element.content ?? {}
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
    return <div aria-hidden className="w-full" style={{ height: style.height || "1.5rem" }} />
  }

  if (element.type === "divider") {
    return <div aria-hidden className="h-px w-full bg-border/60" style={{ margin: style.margin }} />
  }

  if (element.type === "image") {
    return (
      <div className="overflow-hidden" style={baseStyle}>
        <img
          src={typeof content.src === "string" ? content.src : "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80"}
          alt={typeof content.alt === "string" ? content.alt : (typeof content.title === "string" ? content.title : (typeof content.text === "string" ? content.text : "Invitation image"))}
          className="block w-full object-cover"
          style={{ height: style.height || "240px" }}
        />
        {(typeof content.title === "string" || typeof content.description === "string") && (
          <div className="p-4 space-y-1">
            {typeof content.title === "string" && <p className="font-medium text-sm">{content.title}</p>}
            {typeof content.description === "string" && <p className="text-xs text-muted-foreground">{content.description}</p>}
          </div>
        )}
      </div>
    )
  }

  if (element.type === "button") {
    return (
      <div className="flex" style={{ justifyContent: style.justifyContent || "flex-start" }}>
        <Button
          className="border-0 text-white"
          style={baseStyle}
          asChild={Boolean(content.href)}
        >
          {content.href ? (
            <a href={content.href} target="_blank" rel="noreferrer">
              {typeof content.label === "string" ? content.label : (typeof content.text === "string" ? content.text : "Button")}
            </a>
          ) : (
            <span>{typeof content.label === "string" ? content.label : (typeof content.text === "string" ? content.text : "Button")}</span>
          )}
        </Button>
      </div>
    )
  }

  if (element.type === "badge") {
    return (
      <div className="flex" style={{ justifyContent: style.justifyContent || "center" }}>
        <span
          className="inline-flex items-center rounded-full border border-border/60 px-3 py-1 text-xs font-medium"
          style={baseStyle}
        >
          {typeof content.label === "string" ? content.label : (typeof content.text === "string" ? content.text : (typeof content.title === "string" ? content.title : "Badge"))}
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
        {content.title && typeof content.title === "string" && <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{content.title}</p>}
        {content.description && typeof content.description === "string" && <p className="text-sm text-muted-foreground">{content.description}</p>}
        {children.map((child) => (
          <InvitationElementView key={child.id} element={child} />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-2" style={baseStyle}>
      {content.title && typeof content.title === "string" && <p className="text-lg font-semibold">{content.title}</p>}
      {content.text && typeof content.text === "string" && <p className="text-sm leading-relaxed text-muted-foreground">{content.text}</p>}
      {content.description && typeof content.description === "string" && <p className="text-sm leading-relaxed text-muted-foreground">{content.description}</p>}
      {children.length > 0 && (
        <div className="space-y-2 pt-2">
          {children.map((child) => (
            <InvitationElementView key={child.id} element={child} />
          ))}
        </div>
      )}
    </div>
  )
}

// Helper functions
function getDefaultContentForPageType(type: string): PageContent {
  switch (type) {
    case "cover":
      return {
        headline: "You're Invited",
        subheadline: "Join us for a celebration",
        body: "We would be honored to have you at our special event."
      }
    case "details":
      return {
        headline: "Event Details",
        date: "Date TBD",
        time: "Time TBD",
        location: "Location TBD",
        body: "More details about the event will go here."
      }
    case "rsvp":
      return {
        headline: "RSVP",
        subheadline: "Let us know if you can make it",
        fields: [
          { label: "Full Name", type: "text", required: true },
          { label: "Email", type: "email", required: true },
          { label: "Attending", type: "select", required: true }
        ],
        buttons: [{ label: "Submit", action: "submit" }]
      }
    case "location":
      return {
        headline: "Location",
        location: "Address TBD",
        body: "Directions and parking information will go here."
      }
    case "schedule":
      return {
        headline: "Schedule",
        items: [
          { icon: "clock", label: "Arrival", value: "6:00 PM" },
          { icon: "utensils", label: "Dinner", value: "7:00 PM" },
          { icon: "music", label: "Party", value: "8:00 PM" }
        ]
      }
    case "gallery":
      return {
        headline: "Gallery",
        subheadline: "A glimpse of what's to come"
      }
    case "gifts":
      return {
        headline: "Gift Registry",
        body: "Your presence is the greatest gift. But if you'd like to give something, here are some ideas."
      }
    case "faq":
      return {
        headline: "FAQ",
        subheadline: "Frequently Asked Questions"
      }
    default:
      return { headline: "New Page" }
  }
}

function generateFallbackAIResponse(input: string): Message {
  const lowerInput = input.toLowerCase()

  let response = ""

  if (lowerInput.includes("color") || lowerInput.includes("theme")) {
    response = "Let’s make this feel more alive. I’d push the palette toward warmer contrast, soften the shadows, and keep the gradient work intentional rather than decorative."
  } else if (lowerInput.includes("add") && lowerInput.includes("page")) {
    response = "I can help with that. A good next move is to add a page that extends the flow instead of just increasing the page count. Location, schedule, or FAQ would all fit naturally here."
  } else if (lowerInput.includes("font") || lowerInput.includes("text")) {
    response = "The typography should carry more personality without losing clarity. I’d strengthen the hierarchy, give the headlines more presence, and keep the body copy calm and readable."
  } else if (lowerInput.includes("rsvp") || lowerInput.includes("form")) {
    response = "The RSVP page could feel more thoughtful with better spacing, fewer visual distractions, and a cleaner flow through the form fields."
  } else if (lowerInput.includes("animate") || lowerInput.includes("animation")) {
    response = "Yes - but keep the motion purposeful. I’d use gentle entrances, layered transitions, and feedback that feels immediate instead of flashy."
  } else {
    response = `Absolutely — I’d keep pushing this toward something more intentional. The next refinement should create clearer hierarchy, more breathing room, and a stronger emotional tone.`
  }

  return {
    id: Date.now().toString(),
    role: "assistant",
    content: response,
    timestamp: new Date()
  }
}

function applyAiActions(actions: AiAction[], currentPages: InvitePage[]) {
  let nextPages = [...currentPages]
  let activePageId: string | undefined
  let didMutate = false

  for (const action of actions) {
    if (action.type === "patch_page") {
      const pageIndex = nextPages.findIndex(page => page.id === action.pageId)
      if (pageIndex === -1) continue

      nextPages = nextPages.map(page => (
        page.id === action.pageId
          ? { ...page, content: { ...page.content, ...action.content } }
          : page
      ))
      activePageId = action.pageId
      didMutate = true
      continue
    }

    if (action.type === "add_page") {
      const pageType = availablePageTypes.find(page => page.id === action.pageType)
      if (!pageType) continue

      const newPage: InvitePage = {
        id: `${pageType.id}-${Date.now()}-${nextPages.length}`,
        name: action.name || pageType.name,
        icon: pageType.icon,
        content: {
          ...getDefaultContentForPageType(pageType.id),
          ...action.content,
        },
      }

      nextPages = [...nextPages, newPage]
      activePageId = newPage.id
      didMutate = true
      continue
    }

    if (action.type === "focus_page" && nextPages.some(page => page.id === action.pageId)) {
      activePageId = action.pageId
      continue
    }

    if (action.type === "add_element") {
      const pageIndex = nextPages.findIndex(page => page.id === action.pageId)
      if (pageIndex === -1) continue

      const page = nextPages[pageIndex]
      const element = ensureElementDefaults(action.element, page.content.elements?.length ?? 0)
      const updatedPage = addElementToPage(page, element, action.parentElementId)

      nextPages = nextPages.map(currentPage => currentPage.id === action.pageId ? updatedPage : currentPage)
      activePageId = action.pageId
      didMutate = true
      continue
    }

    if (action.type === "patch_element") {
      const pageIndex = nextPages.findIndex(page => page.id === action.pageId)
      if (pageIndex === -1) continue

      const updatedPage = patchElementOnPage(nextPages[pageIndex], action.elementId, action.content)
      if (updatedPage !== nextPages[pageIndex]) {
        nextPages = nextPages.map(currentPage => currentPage.id === action.pageId ? updatedPage : currentPage)
        activePageId = action.pageId
        didMutate = true
      }
      continue
    }

    if (action.type === "remove_element") {
      const pageIndex = nextPages.findIndex(page => page.id === action.pageId)
      if (pageIndex === -1) continue

      const updatedPage = removeElementFromPage(nextPages[pageIndex], action.elementId)
      if (updatedPage !== nextPages[pageIndex]) {
        nextPages = nextPages.map(currentPage => currentPage.id === action.pageId ? updatedPage : currentPage)
        activePageId = action.pageId
        didMutate = true
      }
      continue
    }

    if (action.type === "focus_element") {
      activePageId = action.pageId
    }
  }

  return {
    pages: nextPages,
    activePageId,
    didMutate,
  }
}

function ensureElementDefaults(element: InvitationElement, fallbackOrder: number): InvitationElement {
  return {
    id: element.id || `element-${Date.now()}-${fallbackOrder}`,
    type: element.type,
    order: element.order ?? fallbackOrder,
    content: element.content,
    style: element.style,
    children: element.children?.map((child, index) => ensureElementDefaults(child, index)),
  }
}

function addElementToPage(page: InvitePage, element: InvitationElement, parentElementId?: string) {
  const elements = page.content.elements ? [...page.content.elements] : []

  if (!parentElementId) {
    return {
      ...page,
      content: {
        ...page.content,
        elements: [...elements, element],
      },
    }
  }

  return {
    ...page,
    content: {
      ...page.content,
      elements: patchElementCollection(elements, parentElementId, (target) => ({
        ...target,
        children: [...(target.children ?? []), element],
      })),
    },
  }
}

function patchElementOnPage(page: InvitePage, elementId: string, updates: Partial<InvitationElement>) {
  const elements = page.content.elements ? [...page.content.elements] : []
  const nextElements = patchElementCollection(elements, elementId, (target) => ({
    ...target,
    ...updates,
    content: {
      ...(target.content ?? {}),
      ...(updates.content ?? {}),
    },
    style: {
      ...(target.style ?? {}),
      ...(updates.style ?? {}),
    },
    children: updates.children
      ? updates.children.map((child, index) => ensureElementDefaults(child, index))
      : target.children,
  }))

  if (nextElements === elements) {
    return page
  }

  return {
    ...page,
    content: {
      ...page.content,
      elements: nextElements,
    },
  }
}

function removeElementFromPage(page: InvitePage, elementId: string) {
  const elements = page.content.elements ? [...page.content.elements] : []
  const nextElements = removeElementFromCollection(elements, elementId)

  if (nextElements === elements) {
    return page
  }

  return {
    ...page,
    content: {
      ...page.content,
      elements: nextElements,
    },
  }
}

function patchElementCollection(
  elements: InvitationElement[],
  targetId: string,
  updater: (element: InvitationElement) => InvitationElement
): InvitationElement[] {
  let didMutate = false

  const nextElements: InvitationElement[] = []

  for (const element of elements) {
    if (element.id === targetId) {
      nextElements.push(updater(element))
      didMutate = true
      continue
    }

    if (element.children?.length) {
      const nextChildren = patchElementCollection(element.children, targetId, updater)
      if (nextChildren !== element.children) {
        nextElements.push({ ...element, children: nextChildren })
        didMutate = true
        continue
      }
    }

    nextElements.push(element)
  }

  return didMutate ? nextElements : elements
}

function removeElementFromCollection(elements: InvitationElement[], targetId: string): InvitationElement[] {
  let didMutate = false

  const nextElements: InvitationElement[] = []

  for (const element of elements) {
    if (element.id === targetId) {
      didMutate = true
      continue
    }

    if (element.children?.length) {
      const nextChildren = removeElementFromCollection(element.children, targetId)
      if (nextChildren !== element.children) {
        nextElements.push({ ...element, children: nextChildren })
        didMutate = true
        continue
      }
    }

    nextElements.push(element)
  }

  return didMutate ? nextElements : elements
}
