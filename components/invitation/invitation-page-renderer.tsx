"use client"

import { useState } from "react"
import type { CSSProperties, ElementType, ReactNode } from "react"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import {
    Calendar,
    ChevronRight,
    Clock,
    ExternalLink,
    FileText,
    MapPin,
} from "lucide-react"

const GoogleMap = dynamic(() => import("@/components/ui/google-map").then(mod => ({ default: mod.GoogleMap })), {
    loading: () => (
        <div className="w-full h-full bg-secondary/50 rounded-xl flex items-center justify-center">
            <p className="text-xs text-muted-foreground">Loading map...</p>
        </div>
    ),
    ssr: false,
})

export interface InvitationElement {
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

export interface InvitationPageContent {
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
    items?: Array<{ time?: string; title?: string; description?: string; icon?: string; label?: string; value?: string }>
    images?: string[]
    questions?: Array<{ question: string; answer: string }>
    fields?: Array<{ label: string; type: string; required: boolean; options?: string[] }>
    buttons?: Array<{ label: string; action: string }>
    elements?: InvitationElement[]
    body?: string
}

export interface InvitationPageLike {
    type: string
    content: InvitationPageContent
    icon?: ElementType
}

export function InvitationPageRenderer({
    page,
    rsvpResponse,
    setRsvpResponse,
}: {
    page: InvitationPageLike
    rsvpResponse?: "attending" | "not-attending" | null
    setRsvpResponse?: (response: "attending" | "not-attending" | null) => void
}) {
    const [localRsvpResponse, setLocalRsvpResponse] = useState<"attending" | "not-attending" | null>(null)

    if (!page) {
        return <div className="p-8 text-center text-muted-foreground">No page to display</div>
    }

    const activeRsvpResponse = rsvpResponse ?? localRsvpResponse
    const updateRsvpResponse = setRsvpResponse ?? setLocalRsvpResponse
    const pageContent = renderPage(page, activeRsvpResponse, updateRsvpResponse)

    return (
        <>
            {pageContent}
            <InvitationElements elements={page.content.elements} />
        </>
    )
}

function renderPage(
    page: InvitationPageLike,
    rsvpResponse: "attending" | "not-attending" | null,
    setRsvpResponse: (response: "attending" | "not-attending" | null) => void
): ReactNode {
    switch (page.type) {
        case "cover":
            return <CoverPage content={page.content} icon={page.icon ?? FileText} />
        case "details":
            return <DetailsPage content={page.content} />
        case "rsvp":
            return <RSVPPage content={page.content} rsvpResponse={rsvpResponse} setRsvpResponse={setRsvpResponse} />
        case "location":
            return <LocationPage content={page.content} />
        case "schedule":
            return <SchedulePage content={page.content} />
        case "gallery":
            return <GalleryPage content={page.content} />
        case "registry":
            return <RegistryPage content={page.content} />
        case "faq":
            return <FAQPage content={page.content} />
        default:
            return <GenericPage content={page.content} type={page.type} />
    }
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
    const baseStyle: CSSProperties = {
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
                {element.children?.map((child) => (
                    <InvitationElementRenderer key={child.id} element={child} />
                ))}
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

function CoverPage({ content, icon: Icon }: { content: InvitationPageContent; icon: ElementType }) {
    return (
        <div className="relative min-h-[400px] flex flex-col items-center justify-center text-center p-6 md:p-8">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-accent/10 to-chart-3/20" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(255,255,255,0.08),transparent_70%)]" />

            <div className="absolute top-6 left-6 w-12 h-12 border border-primary/20 rounded-full" />
            <div className="absolute bottom-8 right-8 w-16 h-16 border border-accent/20 rounded-full" />

            <div className="relative z-10 space-y-4">
                <div className="w-14 h-14 mx-auto rounded-2xl gradient-primary flex items-center justify-center mb-6">
                    <Icon className="w-7 h-7 text-white" />
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

function DetailsPage({ content }: { content: InvitationPageContent }) {
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
    setRsvpResponse,
}: {
    content: InvitationPageContent
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
                <p className="text-muted-foreground text-sm">Your RSVP has been received. We look forward to seeing you!</p>
            </div>
        )
    }

    return (
        <div className="p-6 md:p-8 space-y-5">
            <div className="text-center space-y-1">
                <h2 className="text-xl md:text-2xl font-semibold">{content.headline || "RSVP"}</h2>
                {content.subheadline && <p className="text-muted-foreground text-sm">{content.subheadline}</p>}
            </div>

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

                    <Button className="w-full gradient-primary border-0 text-white py-5" onClick={() => setSubmitted(true)}>
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
                    <Button variant="outline" className="w-full py-5" onClick={() => setSubmitted(true)}>
                        Send Response
                    </Button>
                </div>
            )}
        </div>
    )
}

function LocationPage({ content }: { content: InvitationPageContent }) {
    return (
        <div className="p-6 md:p-8 space-y-5">
            <div className="text-center space-y-1">
                <h2 className="text-xl md:text-2xl font-semibold">{content.headline || "Location"}</h2>
            </div>

            <div className="aspect-[16/10] bg-secondary/50 rounded-xl overflow-hidden">
                <GoogleMap
                    address={content.address}
                    venue={content.venue}
                    className="w-full h-full"
                />
            </div>

            <div className="space-y-3">
                {(content.venue || content.address) && (
                    <div className="p-3 bg-secondary/50 rounded-xl">
                        {content.venue && <h3 className="font-medium text-sm mb-0.5">{content.venue}</h3>}
                        {content.address && <p className="text-xs text-muted-foreground">{content.address}</p>}
                    </div>
                )}

                {content.directions && <p className="text-xs text-muted-foreground">{content.directions}</p>}

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

function SchedulePage({ content }: { content: InvitationPageContent }) {
    return (
        <div className="p-6 md:p-8 space-y-5">
            <div className="text-center space-y-1">
                <h2 className="text-xl md:text-2xl font-semibold">{content.headline || "Schedule"}</h2>
            </div>

            <div className="space-y-3">
                {content.items?.map((item, index) => (
                    <div key={index} className="flex gap-3 p-3 bg-secondary/50 rounded-xl relative">
                        {index < (content.items?.length || 0) - 1 && (
                            <div className="absolute left-[1.85rem] top-14 bottom-0 w-px bg-border/50 -mb-3" />
                        )}

                        <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center shrink-0 relative z-10">
                            <Clock className="w-4 h-4 text-white" />
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-xs font-medium text-primary">{item.time || item.label}</span>
                            </div>
                            <h3 className="font-medium text-sm">{item.title || item.value}</h3>
                            {item.description && <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

function GalleryPage({ content }: { content: InvitationPageContent }) {
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

function RegistryPage({ content }: { content: InvitationPageContent }) {
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

function FAQPage({ content }: { content: InvitationPageContent }) {
    return (
        <div className="p-6 md:p-8 space-y-5">
            <div className="text-center space-y-1">
                <h2 className="text-xl md:text-2xl font-semibold">{content.headline || "FAQ"}</h2>
            </div>

            <div className="space-y-3">
                {(content.questions || [
                    { question: "What should I wear?", answer: "Smart casual attire is recommended." },
                    { question: "Is parking available?", answer: "Yes, free parking is available on site." },
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

function GenericPage({ content, type }: { content: InvitationPageContent; type: string }) {
    return (
        <div className="p-6 md:p-8 space-y-5">
            <div className="text-center space-y-1">
                <h2 className="text-xl md:text-2xl font-semibold capitalize">{content.headline || type}</h2>
                {content.subheadline && <p className="text-muted-foreground text-sm">{content.subheadline}</p>}
            </div>

            {content.description && <p className="text-muted-foreground text-sm leading-relaxed">{content.description}</p>}
        </div>
    )
}