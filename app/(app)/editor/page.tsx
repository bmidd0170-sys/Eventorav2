"use client"

import { useState, useRef, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { 
  Sparkles, 
  Send, 
  Plus,
  Copy,
  Download,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
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
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

// Types
type InvitePage = {
  id: string
  name: string
  icon: React.ElementType
  content: PageContent
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
}

type Message = {
  id: string
  role: "assistant" | "user"
  content: string
  timestamp: Date
}

type Version = {
  id: string
  label: string
  timestamp: Date
  pages: InvitePage[]
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
  
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [pages, setPages] = useState<InvitePage[]>(defaultPages)
  const [activePage, setActivePage] = useState<string>("cover")
  const [versions, setVersions] = useState<Version[]>([
    { id: "v1", label: "v1", timestamp: new Date(), pages: defaultPages }
  ])
  const [activeVersion, setActiveVersion] = useState("v1")
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop")
  const [showPagePanel, setShowPagePanel] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Initialize with prompt if provided
  useEffect(() => {
    if (initialPrompt) {
      const welcomeMessage: Message = {
        id: "welcome",
        role: "assistant",
        content: `I'll help you create "${initialPrompt}". I've set up a multi-page invitation with a Cover, Details, and RSVP page. What would you like to customize first?`,
        timestamp: new Date()
      }
      setMessages([welcomeMessage])
    } else {
      const welcomeMessage: Message = {
        id: "welcome",
        role: "assistant",
        content: "Welcome to the editor! I've created a multi-page invitation template for you. You can customize each page, add new pages, or describe the changes you'd like to make.",
        timestamp: new Date()
      }
      setMessages([welcomeMessage])
    }
  }, [initialPrompt])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = () => {
    if (!inputValue.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue("")
    setIsTyping(true)

    // Simulate AI response
    setTimeout(() => {
      const response = generateAIResponse(inputValue.trim(), pages, activePage)
      setMessages(prev => [...prev, response])
      
      // Create a new version when changes are made
      const newVersion: Version = {
        id: `v${versions.length + 1}`,
        label: `v${versions.length + 1}`,
        timestamp: new Date(),
        pages: [...pages]
      }
      setVersions(prev => [...prev, newVersion])
      setActiveVersion(newVersion.id)
      
      setIsTyping(false)
    }, 1500)
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

  const removePage = (pageId: string) => {
    if (pages.length <= 1) return
    setPages(prev => prev.filter(p => p.id !== pageId))
    if (activePage === pageId) {
      setActivePage(pages[0].id)
    }
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
          
          {/* Version selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1">
                <span className="font-medium">{activeVersion}</span>
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {versions.map((version) => (
                <DropdownMenuItem 
                  key={version.id}
                  onClick={() => setActiveVersion(version.id)}
                >
                  <span className="flex-1">{version.label}</span>
                  {activeVersion === version.id && <Check className="w-4 h-4 text-primary" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="w-px h-5 bg-border" />

          {/* Undo/Redo */}
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Undo2 className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Redo2 className="w-4 h-4" />
            </Button>
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

          <Button variant="ghost" size="sm">
            <Eye className="w-4 h-4 mr-1.5" />
            Preview
          </Button>

          <Button 
            size="sm" 
            className="gradient-primary border-0 text-white"
            onClick={() => router.push("/publish")}
          >
            Publish
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left panel - Chat */}
        <div className="w-[400px] flex flex-col border-r border-border/50 bg-card/30">
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
                      <span className="text-xs text-muted-foreground">Eventora</span>
                    </div>
                  )}
                  <div className={`rounded-2xl px-4 py-3 ${
                    message.role === "user" 
                      ? "bg-primary text-primary-foreground rounded-br-sm" 
                      : "bg-secondary rounded-bl-sm"
                  }`}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
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
            <div className="relative bg-secondary rounded-xl">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe changes to your invitation..."
                rows={2}
                className="w-full bg-transparent px-4 pt-3 pb-10 text-sm resize-none focus:outline-none placeholder:text-muted-foreground/60"
              />
              <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground">
                    <Palette className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground">
                    <Type className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground">
                    <ImageIcon className="w-4 h-4" />
                  </Button>
                </div>
                <Button 
                  size="icon" 
                  disabled={!inputValue.trim()}
                  onClick={handleSendMessage}
                  className={`h-7 w-7 rounded-lg ${
                    inputValue.trim() 
                      ? "gradient-primary border-0 text-white" 
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                </Button>
              </div>
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
                    className={`group flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer transition-all ${
                      activePage === page.id 
                        ? "bg-primary/20 text-foreground" 
                        : "hover:bg-secondary text-muted-foreground hover:text-foreground"
                    }`}
                    onClick={() => setActivePage(page.id)}
                  >
                    <GripVertical className="w-3 h-3 text-muted-foreground/50 cursor-grab" />
                    <page.icon className="w-4 h-4 shrink-0" />
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
              className={`transition-all duration-300 ${
                previewMode === "mobile" 
                  ? "w-[375px]" 
                  : "w-full max-w-lg"
              }`}
            >
              <InvitePagePreview page={currentPage} />
            </div>

            {/* Version indicator */}
            <div className="absolute bottom-4 right-4 flex items-center gap-2">
              {versions.slice(-3).map((version) => (
                <button
                  key={version.id}
                  onClick={() => setActiveVersion(version.id)}
                  className={`w-8 h-8 rounded-lg border text-xs font-medium transition-all ${
                    activeVersion === version.id
                      ? "border-primary bg-primary/20 text-primary"
                      : "border-border/50 bg-card/50 text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  {version.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Invite page preview component
function InvitePagePreview({ page }: { page: InvitePage }) {
  const { content } = page

  return (
    <div className="bg-card rounded-2xl border border-border/50 overflow-hidden shadow-2xl">
      {/* Page header with gradient */}
      <div className="h-28 bg-gradient-to-br from-primary/30 via-accent/20 to-chart-3/20 relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.1),transparent)]" />
      </div>

      {/* Content */}
      <div className="p-8 -mt-12 relative">
        {/* Icon badge */}
        <div className="w-14 h-14 mx-auto rounded-full bg-card border-4 border-card flex items-center justify-center shadow-lg mb-6">
          <page.icon className="w-5 h-5 text-primary" />
        </div>

        <div className="text-center space-y-6">
          {content.headline && (
            <h2 className="text-2xl font-semibold gradient-text">{content.headline}</h2>
          )}
          
          {content.subheadline && (
            <p className="text-sm text-muted-foreground">{content.subheadline}</p>
          )}

          {content.body && (
            <p className="text-sm text-muted-foreground leading-relaxed">{content.body}</p>
          )}

          {/* Date/Time/Location */}
          {(content.date || content.time || content.location) && (
            <div className="space-y-3 py-4">
              {content.date && (
                <div className="flex items-center justify-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span>{content.date}</span>
                </div>
              )}
              {content.time && (
                <div className="flex items-center justify-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-accent" />
                  <span>{content.time}</span>
                </div>
              )}
              {content.location && (
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
        </div>
      </div>
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

function generateAIResponse(input: string, pages: InvitePage[], activePage: string): Message {
  const lowerInput = input.toLowerCase()
  
  let response = ""
  
  if (lowerInput.includes("color") || lowerInput.includes("theme")) {
    response = "I've updated the color scheme! The new palette uses warmer tones with a gradient from coral to gold. Would you like me to adjust the intensity or try a different combination?"
  } else if (lowerInput.includes("add") && lowerInput.includes("page")) {
    response = "I can help you add a new page! You can add pages using the + button in the Pages panel on the left. Available options include Location & Map, Schedule, Photo Gallery, Gift Registry, and FAQ sections."
  } else if (lowerInput.includes("font") || lowerInput.includes("text")) {
    response = "I've updated the typography! The headlines now use a more elegant serif font, while the body text remains clean and readable. The text hierarchy has been improved for better visual flow."
  } else if (lowerInput.includes("rsvp") || lowerInput.includes("form")) {
    response = "I've enhanced the RSVP page with additional fields. Guests can now specify dietary requirements and plus-one details. Would you like to add any custom questions?"
  } else if (lowerInput.includes("animate") || lowerInput.includes("animation")) {
    response = "I've added subtle entrance animations to make the invitation feel more alive! Elements will gracefully fade and slide in as guests scroll through each page."
  } else {
    response = `I've made updates based on your request! The changes are reflected in the preview. Here's what I did:\n\n• Refined the overall design to match your vision\n• Adjusted spacing and layout for better readability\n• Enhanced visual hierarchy across all pages\n\nWould you like to make any additional adjustments?`
  }

  return {
    id: Date.now().toString(),
    role: "assistant",
    content: response,
    timestamp: new Date()
  }
}
