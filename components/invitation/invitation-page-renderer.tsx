"use client"

import { useState } from "react"
import type { CSSProperties, ElementType, ReactNode } from "react"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { useBrand } from "@/components/brand/brand-provider"
import type { BrandSettings } from "@/lib/branding"
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

type RsvpField = { label: string; type: string; required: boolean; options?: string[] }

const declineIdentityFields: RsvpField[] = [
    { label: "Full Name", type: "text", required: true },
    { label: "Email", type: "email", required: true },
]

function extractGuestInfo(
    fields: RsvpField[],
    values: Record<number, string>
): { guestEmail: string; guestName: string } {
    let guestEmail = ""
    let guestName = ""

    fields.forEach((field, index) => {
        const value = values[index]?.trim() ?? ""
        if (!value) return

        const labelLower = field.label.toLowerCase()
        if (field.type === "email" || labelLower.includes("email")) {
            guestEmail = value
        } else if (labelLower.includes("name")) {
            guestName = value
        }
    })

    return { guestEmail, guestName }
}

export function InvitationPageRenderer({
    page,
    rsvpResponse,
    setRsvpResponse,
    brand,
    onNavigateNext,
    eventId,
}: {
    page: InvitationPageLike
    rsvpResponse?: "attending" | "not-attending" | null
    setRsvpResponse?: (response: "attending" | "not-attending" | null) => void
    brand?: BrandSettings | null
    onNavigateNext?: () => void
    eventId?: string
}) {
    const { brand: contextBrand } = useBrand()
    const [localRsvpResponse, setLocalRsvpResponse] = useState<"attending" | "not-attending" | null>(null)

    if (!page) {
        return <div className="p-8 text-center text-muted-foreground">No page to display</div>
    }

    const activeBrand = brand ?? contextBrand
    const activeRsvpResponse = rsvpResponse ?? localRsvpResponse
    const updateRsvpResponse = setRsvpResponse ?? setLocalRsvpResponse
    const pageContent = renderPage(page, activeRsvpResponse, updateRsvpResponse, activeBrand, onNavigateNext, eventId)

    return (
        <div className="invitation-root h-full" style={getInvitationBrandStyles(activeBrand)}>
            {pageContent}
            <InvitationElements elements={page.content.elements} />
        </div>
    )
}

export function getInvitationBrandStyles(brand?: BrandSettings | null): CSSProperties {
    if (!brand) {
        return {}
    }

    const primary = brand.primaryColor?.trim()
    const secondary = brand.secondaryColor?.trim()
    const accent = brand.accentColor?.trim()
    const headingFont = brand.headingFont?.trim()
    const bodyFont = brand.bodyFont?.trim()

    return {
        ...(primary ? {
            ["--brand-primary" as any]: primary,
            ["--brand-heading-color" as any]: primary,
            ["--primary" as any]: primary,
            ["--ring" as any]: primary,
            ["--chart-1" as any]: primary,
        } : {}),
        ...(secondary ? {
            ["--brand-secondary" as any]: secondary,
            ["--secondary" as any]: secondary,
            ["--chart-3" as any]: secondary,
        } : {}),
        ...(accent ? {
            ["--brand-accent" as any]: accent,
            ["--accent" as any]: accent,
            ["--chart-2" as any]: accent,
        } : {}),
        ...(bodyFont ? {
            ["--brand-font-body" as any]: bodyFont,
            ["--font-sans" as any]: bodyFont,
            fontFamily: bodyFont,
        } : {}),
        ...(headingFont ? {
            ["--brand-font-heading" as any]: headingFont,
        } : {}),
        ...(primary ? {
            ["--background" as any]: `color-mix(in srgb, ${primary} 8%, oklch(0.13 0.01 270))`,
            ["--card" as any]: `color-mix(in srgb, ${primary} 10%, oklch(0.17 0.015 270))`,
            ["--popover" as any]: `color-mix(in srgb, ${primary} 10%, oklch(0.17 0.015 270))`,
            ["--muted" as any]: `color-mix(in srgb, ${primary} 8%, oklch(0.25 0.015 270))`,
            ["--border" as any]: `color-mix(in srgb, ${primary} 18%, oklch(0.30 0.02 270))`,
            ["--input" as any]: `color-mix(in srgb, ${primary} 14%, oklch(0.22 0.02 270))`,
        } : {}),
    }
}

function renderPage(
    page: InvitationPageLike,
    rsvpResponse: "attending" | "not-attending" | null,
    setRsvpResponse: (response: "attending" | "not-attending" | null) => void,
    brand?: BrandSettings | null,
    onNavigateNext?: () => void,
    eventId?: string
): ReactNode {
    switch (page.type) {
        case "cover":
            return <CoverPage content={page.content} icon={page.icon ?? FileText} brand={brand} onNavigateNext={onNavigateNext} />
        case "details":
            return <DetailsPage content={page.content} brand={brand} />
        case "rsvp":
            return <RSVPPage content={page.content} rsvpResponse={rsvpResponse} setRsvpResponse={setRsvpResponse} brand={brand} eventId={eventId} />
        case "location":
            return <LocationPage content={page.content} brand={brand} />
        case "schedule":
            return <SchedulePage content={page.content} brand={brand} />
        case "gallery":
            return <GalleryPage content={page.content} brand={brand} />
        case "registry":
            return <RegistryPage content={page.content} brand={brand} />
        case "faq":
            return <FAQPage content={page.content} brand={brand} />
        default:
            return <GenericPage content={page.content} type={page.type} brand={brand} />
    }
}

function getBrandPalette(brand?: BrandSettings | null) {
    return {
        primary: brand?.primaryColor?.trim(),
        secondary: brand?.secondaryColor?.trim(),
        accent: brand?.accentColor?.trim(),
        headingFont: brand?.headingFont?.trim(),
        bodyFont: brand?.bodyFont?.trim(),
    }
}

function getThemedCardStyle(brand?: BrandSettings | null, variant: "primary" | "secondary" | "accent" = "primary"): CSSProperties {
    const palette = getBrandPalette(brand)
    const tone = variant === "primary" ? palette.primary : variant === "secondary" ? palette.secondary : palette.accent

    if (!tone) {
        return {}
    }

    return {
        background: `linear-gradient(180deg, color-mix(in srgb, ${tone} 12%, var(--card)) 0%, color-mix(in srgb, ${tone} 5%, var(--card)) 100%)`,
        border: `1px solid color-mix(in srgb, ${tone} 18%, var(--border))`,
        boxShadow: `0 10px 30px color-mix(in srgb, ${tone} 14%, transparent)`,
    }
}

function getThemedIconChipStyle(brand?: BrandSettings | null, variant: "primary" | "secondary" | "accent" = "primary"): CSSProperties {
    const palette = getBrandPalette(brand)
    const tone = variant === "primary" ? palette.primary : variant === "secondary" ? palette.secondary : palette.accent

    if (!tone) {
        return {}
    }

    return {
        background: `color-mix(in srgb, ${tone} 16%, transparent)`,
        border: `1px solid color-mix(in srgb, ${tone} 24%, transparent)`,
        color: tone,
    }
}

function getHeadingStyle(brand?: BrandSettings | null): CSSProperties {
    const palette = getBrandPalette(brand)
    return {
        color: palette.primary || "var(--foreground)",
        fontFamily: palette.headingFont || "var(--font-sans)",
    }
}

function getBodyStyle(brand?: BrandSettings | null): CSSProperties {
    const palette = getBrandPalette(brand)
    return {
        fontFamily: palette.bodyFont || "var(--font-sans)",
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

function CoverPage({
    content,
    icon: Icon,
    brand,
    onNavigateNext,
}: {
    content: InvitationPageContent
    icon: ElementType
    brand?: {
        defaultHeadline?: string
        defaultSubheadline?: string
        defaultCtaLabel?: string
    } | null
    onNavigateNext?: () => void
}) {
    const headline = content.headline || brand?.defaultHeadline || "You're Invited"
    const subheadline = content.subheadline || brand?.defaultSubheadline || "to a Special Event"
    const ctaLabel = content.buttons?.[0]?.label || brand?.defaultCtaLabel || "View Details"

    return (
        <div className="relative min-h-[400px] h-full flex flex-col items-center justify-center text-center p-6 md:p-8">
            <div
                className="absolute inset-0"
                style={{
                    background: "linear-gradient(135deg, color-mix(in srgb, var(--brand-primary, var(--primary)) 20%, transparent), color-mix(in srgb, var(--brand-accent, var(--accent)) 10%, transparent), color-mix(in srgb, var(--brand-secondary, var(--chart-3)) 20%, transparent))",
                }}
            />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(255,255,255,0.08),transparent_70%)]" />

            <div className="absolute top-6 left-6 w-12 h-12 rounded-full" style={{ border: "1px solid color-mix(in srgb, var(--brand-primary, var(--primary)) 20%, transparent)" }} />
            <div className="absolute bottom-8 right-8 w-16 h-16 rounded-full" style={{ border: "1px solid color-mix(in srgb, var(--brand-accent, var(--accent)) 20%, transparent)" }} />

            <div className="relative z-10 space-y-4">
                <div className="w-14 h-14 mx-auto rounded-2xl gradient-primary flex items-center justify-center mb-6">
                    <Icon className="w-7 h-7 text-white" />
                </div>

                <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-clip-text text-balance" style={{ color: 'var(--brand-heading-color)', fontFamily: 'var(--brand-font-heading)' }}>
                    {headline}
                </h1>

                <p className="text-lg text-muted-foreground" style={{ fontFamily: 'var(--brand-font-body)' }}>
                    {subheadline}
                </p>

                {content.hostName && (
                    <div className="pt-4">
                        <p className="text-sm text-muted-foreground/80">Hosted by</p>
                        <p className="text-lg font-medium mt-1">{content.hostName}</p>
                    </div>
                )}

                <div className="pt-6">
                    <Button
                        className="border-0 text-white px-6"
                        style={{ background: 'var(--brand-primary)', borderColor: 'var(--brand-primary)' }}
                        onClick={onNavigateNext}
                    >
                        {ctaLabel}
                        <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                </div>
            </div>
        </div>
    )
}

function DetailsPage({ content, brand }: { content: InvitationPageContent; brand?: BrandSettings | null }) {
    return (
        <div className="p-6 md:p-8 space-y-6" style={getBodyStyle(brand)}>
            <div className="text-center space-y-2">
                <h2 className="text-xl md:text-2xl font-semibold" style={getHeadingStyle(brand)}>{content.headline || "Event Details"}</h2>
            </div>

            <div className="space-y-3">
                {content.date && (
                    <div className="flex items-start gap-3 p-3 rounded-xl" style={getThemedCardStyle(brand, "primary")}>
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={getThemedIconChipStyle(brand, "primary")}>
                            <Calendar className="w-4 h-4" style={getHeadingStyle(brand)} />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Date</p>
                            <p className="font-medium text-sm">{content.date}</p>
                        </div>
                    </div>
                )}

                {content.time && (
                    <div className="flex items-start gap-3 p-3 rounded-xl" style={getThemedCardStyle(brand, "accent")}>
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={getThemedIconChipStyle(brand, "accent")}>
                            <Clock className="w-4 h-4" style={brand?.accentColor ? { color: brand.accentColor } : undefined} />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Time</p>
                            <p className="font-medium text-sm">{content.time}</p>
                        </div>
                    </div>
                )}

                {content.location && (
                    <div className="flex items-start gap-3 p-3 rounded-xl" style={getThemedCardStyle(brand, "secondary")}>
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={getThemedIconChipStyle(brand, "secondary")}>
                            <MapPin className="w-4 h-4" style={brand?.secondaryColor ? { color: brand.secondaryColor } : undefined} />
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

function RsvpFieldInput({
    field,
    value,
    onChange,
    brand,
}: {
    field: RsvpField
    value: string
    onChange: (value: string) => void
    brand?: BrandSettings | null
}) {
    const inputClassName = "w-full px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2"
    const inputStyle = getThemedCardStyle(brand, "primary")

    if (field.type === "textarea") {
        return (
            <textarea
                className={`${inputClassName} resize-none`}
                style={inputStyle}
                rows={2}
                placeholder={`Enter ${field.label.toLowerCase()}...`}
                value={value}
                onChange={(event) => onChange(event.target.value)}
            />
        )
    }

    if (field.type === "select") {
        return (
            <select
                className={inputClassName}
                style={inputStyle}
                value={value}
                onChange={(event) => onChange(event.target.value)}
            >
                <option value="">Select...</option>
                {field.options?.map((option) => (
                    <option key={option} value={option}>{option}</option>
                ))}
            </select>
        )
    }

    return (
        <input
            type={field.type}
            className={inputClassName}
            style={inputStyle}
            placeholder={`Enter ${field.label.toLowerCase()}...`}
            value={value}
            onChange={(event) => onChange(event.target.value)}
        />
    )
}

function RSVPPage({
    content,
    rsvpResponse,
    setRsvpResponse,
    brand,
    eventId,
}: {
    content: InvitationPageContent
    rsvpResponse: "attending" | "not-attending" | null
    setRsvpResponse: (response: "attending" | "not-attending" | null) => void
    brand?: BrandSettings | null
    eventId?: string
}) {
    const [submitted, setSubmitted] = useState(false)
    const [fieldValues, setFieldValues] = useState<Record<number, string>>({})
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitError, setSubmitError] = useState<string | null>(null)

    const attendingFields = content.fields?.length ? content.fields : declineIdentityFields
    const activeFields = rsvpResponse === "not-attending" ? declineIdentityFields : attendingFields

    const updateFieldValue = (index: number, value: string) => {
        setFieldValues((current) => ({ ...current, [index]: value }))
        if (submitError) setSubmitError(null)
    }

    const handleSubmit = async () => {
        if (!rsvpResponse) return

        for (const [index, field] of activeFields.entries()) {
            if (field.required && !fieldValues[index]?.trim()) {
                setSubmitError(`Please fill in ${field.label}.`)
                return
            }
        }

        const { guestEmail, guestName } = extractGuestInfo(activeFields, fieldValues)
        if (!guestEmail) {
            setSubmitError("Please enter your email address.")
            return
        }

        if (!eventId) {
            setSubmitted(true)
            return
        }

        setIsSubmitting(true)
        setSubmitError(null)

        try {
            const response = await fetch("/api/invitations/respond", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    eventId,
                    guestEmail,
                    guestName: guestName || undefined,
                    response: rsvpResponse,
                }),
            })

            const data = await response.json().catch(() => ({}))
            if (!response.ok) {
                throw new Error(typeof data.error === "string" ? data.error : "Failed to submit RSVP")
            }

            setSubmitted(true)
        } catch (error) {
            setSubmitError(error instanceof Error ? error.message : "Failed to submit RSVP")
        } finally {
            setIsSubmitting(false)
        }
    }

    if (submitted) {
        return (
            <div className="p-6 md:p-8 min-h-[300px] flex flex-col items-center justify-center text-center">
                <div className="w-14 h-14 rounded-full gradient-primary flex items-center justify-center mb-4">
                    <Calendar className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-xl font-semibold mb-2">Thank You!</h2>
                <p className="text-muted-foreground text-sm">
                    {rsvpResponse === "not-attending"
                        ? "Your response has been received. We'll miss you!"
                        : "Your RSVP has been received. We look forward to seeing you!"}
                </p>
            </div>
        )
    }

    return (
            <div className="p-6 md:p-8 space-y-5" style={getBodyStyle(brand)}>
            <div className="text-center space-y-1">
                <h2 className="text-xl md:text-2xl font-semibold" style={getHeadingStyle(brand)}>{content.headline || "RSVP"}</h2>
                {content.subheadline && <p className="text-muted-foreground text-sm">{content.subheadline}</p>}
            </div>

            <div className="flex gap-3">
                <button
                    onClick={() => {
                        setRsvpResponse("attending")
                        setFieldValues({})
                        setSubmitError(null)
                    }}
                    className={`flex-1 py-3 rounded-xl border-2 transition-all ${rsvpResponse === "attending"
                            ? "text-foreground"
                            : "border-border/50"
                        }`}
                    style={rsvpResponse === "attending" ? getThemedCardStyle(brand, "accent") : undefined}
                >
                    <p className="font-medium text-sm" style={rsvpResponse === "attending" && brand?.accentColor ? { color: brand.accentColor } : undefined}>Attending</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Count me in!</p>
                </button>
                <button
                    onClick={() => {
                        setRsvpResponse("not-attending")
                        setFieldValues({})
                        setSubmitError(null)
                    }}
                    className={`flex-1 py-3 rounded-xl border-2 transition-all ${rsvpResponse === "not-attending"
                            ? "text-foreground"
                            : "border-border/50"
                        }`}
                    style={rsvpResponse === "not-attending" ? getThemedCardStyle(brand, "secondary") : undefined}
                >
                    <p className="font-medium text-sm" style={rsvpResponse === "not-attending" && brand?.secondaryColor ? { color: brand.secondaryColor } : undefined}>Not Attending</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{"Can't make it"}</p>
                </button>
            </div>

            {rsvpResponse === "attending" && (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    {attendingFields.map((field, index) => (
                        <div key={index} className="space-y-1.5">
                            <label className="text-sm font-medium">
                                {field.label}
                                {field.required && <span className="text-destructive ml-1">*</span>}
                            </label>
                            <RsvpFieldInput
                                field={field}
                                value={fieldValues[index] ?? ""}
                                onChange={(value) => updateFieldValue(index, value)}
                                brand={brand}
                            />
                        </div>
                    ))}

                    {submitError && <p className="text-sm text-destructive">{submitError}</p>}

                    <Button
                        className="w-full gradient-primary border-0 text-white py-5"
                        onClick={() => void handleSubmit()}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "Submitting..." : "Submit RSVP"}
                    </Button>
                </div>
            )}

            {rsvpResponse === "not-attending" && (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    {declineIdentityFields.map((field, index) => (
                        <div key={index} className="space-y-1.5">
                            <label className="text-sm font-medium">
                                {field.label}
                                {field.required && <span className="text-destructive ml-1">*</span>}
                            </label>
                            <RsvpFieldInput
                                field={field}
                                value={fieldValues[index] ?? ""}
                                onChange={(value) => updateFieldValue(index, value)}
                                brand={brand}
                            />
                        </div>
                    ))}

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium">Send a message (optional)</label>
                        <textarea
                            className="w-full px-3 py-2 bg-secondary rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                            rows={2}
                            placeholder="Sorry I can't make it..."
                            value={fieldValues[declineIdentityFields.length] ?? ""}
                            onChange={(event) => updateFieldValue(declineIdentityFields.length, event.target.value)}
                        />
                    </div>

                    {submitError && <p className="text-sm text-destructive">{submitError}</p>}

                    <Button
                        variant="outline"
                        className="w-full py-5"
                        onClick={() => void handleSubmit()}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "Sending..." : "Send Response"}
                    </Button>
                </div>
            )}
        </div>
    )
}

function LocationPage({ content, brand }: { content: InvitationPageContent; brand?: BrandSettings | null }) {
    return (
        <div className="p-6 md:p-8 space-y-5" style={getBodyStyle(brand)}>
            <div className="text-center space-y-1">
                <h2 className="text-xl md:text-2xl font-semibold" style={getHeadingStyle(brand)}>{content.headline || "Location"}</h2>
            </div>

            <div className="aspect-[16/10] rounded-xl overflow-hidden" style={getThemedCardStyle(brand, "primary")}>
                <GoogleMap
                    address={content.address}
                    venue={content.venue}
                    className="w-full h-full"
                />
            </div>

            <div className="space-y-3">
                {(content.venue || content.address) && (
                    <div className="p-3 rounded-xl" style={getThemedCardStyle(brand, "secondary")}>
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

function SchedulePage({ content, brand }: { content: InvitationPageContent; brand?: BrandSettings | null }) {
    return (
        <div className="p-6 md:p-8 space-y-5" style={getBodyStyle(brand)}>
            <div className="text-center space-y-1">
                <h2 className="text-xl md:text-2xl font-semibold" style={getHeadingStyle(brand)}>{content.headline || "Schedule"}</h2>
            </div>

            <div className="space-y-3">
                {content.items?.map((item, index) => (
                    <div key={index} className="flex gap-3 p-3 rounded-xl relative" style={getThemedCardStyle(brand, "primary")}>
                        {index < (content.items?.length || 0) - 1 && (
                            <div className="absolute left-[1.85rem] top-14 bottom-0 w-px bg-border/50 -mb-3" />
                        )}

                        <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center shrink-0 relative z-10" style={getThemedIconChipStyle(brand, "primary")}>
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

function GalleryPage({ content, brand }: { content: InvitationPageContent; brand?: BrandSettings | null }) {
    return (
        <div className="p-6 md:p-8 space-y-5" style={getBodyStyle(brand)}>
            <div className="text-center space-y-1">
                <h2 className="text-xl md:text-2xl font-semibold" style={getHeadingStyle(brand)}>{content.headline || "Gallery"}</h2>
            </div>

            {content.images && content.images.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                    {content.images.map((imageSrc, index) => (
                        <div key={`${index}-${imageSrc.slice(0, 16)}`} className="aspect-square overflow-hidden rounded-lg" style={getThemedCardStyle(brand, "secondary")}>
                            <img
                                src={imageSrc}
                                alt={`Gallery image ${index + 1}`}
                                className="h-full w-full object-cover"
                            />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-2">
                    {[1, 2, 3, 4].map((item, index) => (
                        <div key={item} className="aspect-square rounded-lg flex items-center justify-center" style={getThemedCardStyle(brand, "secondary")}>
                            <span className="text-muted-foreground/30 text-xs">Image {index + 1}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

function RegistryPage({ content, brand }: { content: InvitationPageContent; brand?: BrandSettings | null }) {
    return (
        <div className="p-6 md:p-8 space-y-5" style={getBodyStyle(brand)}>
            <div className="text-center space-y-1">
                <h2 className="text-xl md:text-2xl font-semibold" style={getHeadingStyle(brand)}>{content.headline || "Gift Registry"}</h2>
                {content.message && <p className="text-muted-foreground text-sm">{content.message}</p>}
            </div>

            <div className="p-4 rounded-xl text-center" style={getThemedCardStyle(brand, "primary")}>
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

function FAQPage({ content, brand }: { content: InvitationPageContent; brand?: BrandSettings | null }) {
    return (
        <div className="p-6 md:p-8 space-y-5" style={getBodyStyle(brand)}>
            <div className="text-center space-y-1">
                <h2 className="text-xl md:text-2xl font-semibold" style={getHeadingStyle(brand)}>{content.headline || "FAQ"}</h2>
            </div>

            <div className="space-y-3">
                {(content.questions || [
                    { question: "What should I wear?", answer: "Smart casual attire is recommended." },
                    { question: "Is parking available?", answer: "Yes, free parking is available on site." },
                ]).map((item, index) => (
                    <div key={index} className="p-3 rounded-xl" style={getThemedCardStyle(brand, "secondary")}>
                        <p className="font-medium text-sm mb-1">{item.question}</p>
                        <p className="text-xs text-muted-foreground">{item.answer}</p>
                    </div>
                ))}
            </div>
        </div>
    )
}

function GenericPage({ content, type, brand }: { content: InvitationPageContent; type: string; brand?: BrandSettings | null }) {
    return (
        <div className="p-6 md:p-8 space-y-5" style={getBodyStyle(brand)}>
            <div className="text-center space-y-1">
                <h2 className="text-xl md:text-2xl font-semibold capitalize" style={getHeadingStyle(brand)}>{content.headline || type}</h2>
                {content.subheadline && <p className="text-muted-foreground text-sm">{content.subheadline}</p>}
            </div>

            {content.description && <p className="text-muted-foreground text-sm leading-relaxed">{content.description}</p>}
        </div>
    )
}