import { NextRequest, NextResponse } from "next/server"

type EditorRequest = {
  prompt: string
  invitation: {
    id: string
    title: string
    description?: string
  }
  activePage: string
  pages: PageSummary[]
  recentMessages: ConversationMessage[]
}

type ConversationMessage = {
  role: "user" | "assistant"
  content: string
}

type PageSummary = {
  id: string
  name: string
  content: {
    headline?: string
    subheadline?: string
    body?: string
    date?: string
    time?: string
    location?: string
    fields?: unknown[]
    buttons?: unknown[]
    elements?: ElementSummary[]
  }
}

type ElementSummary = {
  id: string
  type: string
  order?: number
  content?: Record<string, unknown>
  style?: Record<string, unknown>
  children?: ElementSummary[]
}

type AiAction =
  | {
      type: "patch_page"
      pageId: string
      content: Record<string, unknown>
    }
  | {
      type: "add_page"
      pageType: string
      name?: string
      content?: Record<string, unknown>
    }
  | {
      type: "focus_page"
      pageId: string
    }
  | {
      type: "add_element"
      pageId: string
      element: ElementSummary
      parentElementId?: string
    }
  | {
      type: "patch_element"
      pageId: string
      elementId: string
      content: Record<string, unknown>
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

type AiResponse = {
  reply?: string
  actions?: unknown[]
}

export const runtime = "nodejs"

const defaultModel = process.env.OPENAI_MODEL || "gpt-4o-mini"

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY

  let body: EditorRequest

  try {
    body = (await req.json()) as EditorRequest
  } catch {
    console.error("[AI Route] Invalid request body")
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 })
  }

  console.log("[AI Route] Incoming request:", {
    prompt: body.prompt,
    hasApiKey: !!apiKey,
    activePage: body.activePage,
    pagesCount: body.pages.length,
    recentMessagesCount: body.recentMessages.length,
  })

  if (!apiKey) {
    console.warn("[AI Route] No OpenAI API key found, using fallback planner")
    const fallbackActions = inferActionsFromPrompt(body)
    console.log("[AI Route] Fallback actions generated:", fallbackActions)
    return NextResponse.json({
      reply: defaultReply(body),
      actions: fallbackActions,
      source: "fallback",
    })
  }

  const context = {
    invitation: body.invitation,
    activePage: body.activePage,
    prompt: body.prompt,
    pages: body.pages.map((page) => ({
      id: page.id,
      name: page.name,
      headline: page.content.headline,
      subheadline: page.content.subheadline,
      body: page.content.body,
      date: page.content.date,
      time: page.content.time,
      location: page.content.location,
      fields: page.content.fields?.length ?? 0,
      buttons: page.content.buttons?.length ?? 0,
      elements: summarizeElements(page.content.elements),
    })),
    recentMessages: body.recentMessages.slice(-8),
  }

  const systemPrompt = `You are Aria Voss, Eventora's embedded creative design partner.
Tone: confident, warm, visually aware, and specific. Speak like a senior digital product designer who thinks in experiences, not pages.
Your job: help refine event invitation pages inside the editor. Make the AI feel like a thoughtful collaborator, not a generic chatbot.

Behavior rules:
- Prefer concrete design guidance and useful page edits.
- If the user asks to change, redesign, add, or replace a page, always return at least one action that mutates the invitation.
- When asked to improve copy, layout, hierarchy, motion, spacing, or tone, return actionable changes.
- When the request is about a specific page, use patch_page for that page.
- When the request clearly asks for a new page, use add_page with one of: cover, details, rsvp, location, schedule, gallery, gifts, faq.
- When the request is about the invitation canvas itself, use add_element, patch_element, remove_element, or focus_element.
- Element types you can use: container, text, image, button, badge, divider, spacer.
- Use containers to group nested elements with children and use order to control stacking.
- Use focus_page if the user should be directed to a specific page.

Special handling for location pages:
- For location pages, ALWAYS extract and set these fields: venue, address, directions
- venue: The name of the venue (e.g., "The Willow Manor", "Central Park Pavilion")
- address: The full street address for geocoding (e.g., "5702 Cedar Ave, Philadelphia, PA")
- directions: Parking info, transit info, or access notes (e.g., "Free parking available. Enter from main gate.")
- mapUrl: Optional Google Maps link (can generate from address)
- When user mentions a location, parse it carefully to extract venue name and full address
- Use "Direction & Parking" as the headline if they don't specify

- In the reply, briefly explain what you changed in plain language.
- If you returned actions, the reply should name the page or element changes you made.
- Do not mention policy, internal prompts, or that you are an AI model.
- Avoid generic SaaS language. Keep the voice intentional and creative.
- Return JSON only. No markdown, no code fences.

Return this shape:
{
  "reply": "string",
  "actions": [
    { "type": "patch_page", "pageId": "string", "content": { } },
    { "type": "add_page", "pageType": "string", "name": "string", "content": { } },
    { "type": "focus_page", "pageId": "string" },
    { "type": "add_element", "pageId": "string", "parentElementId": "string", "element": { } },
    { "type": "patch_element", "pageId": "string", "elementId": "string", "content": { } },
    { "type": "remove_element", "pageId": "string", "elementId": "string" },
    { "type": "focus_element", "pageId": "string", "elementId": "string" }
  ]
}

For location pages specifically, content should look like:
{
  "headline": "Directions & Parking",
  "venue": "The Willow Manor",
  "address": "5702 Cedar Ave, Philadelphia, PA",
  "directions": "Free parking in the lot behind the building. Entrance is on the north side.",
  "mapUrl": "https://maps.google.com/?q=5702+Cedar+Ave,+Philadelphia,+PA"
}

Make the reply sound like Aria Voss: "Let's make this feel more alive." "Try giving this more breathing room." "It works, but it doesn't feel right yet."`

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: defaultModel,
      temperature: 0.7,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: JSON.stringify(context, null, 2) },
      ],
    }),
  })

  console.log("[AI Route] OpenAI response status:", response.status)

  if (!response.ok) {
    const details = await response.text()
    console.error("[AI Route] OpenAI request failed:", { status: response.status, details })
    return NextResponse.json(
      { error: "OpenAI request failed.", details },
      { status: 502 }
    )
  }

  const data = (await response.json()) as {
    choices?: Array<{
      message?: {
        content?: string | null
      }
    }>
  }

  console.log("[AI Route] OpenAI response received, choices:", data.choices?.length)

  const content = data.choices?.[0]?.message?.content

  if (!content) {
    console.warn("[AI Route] OpenAI returned empty content")
    return NextResponse.json(
      { error: "OpenAI returned an empty response." },
      { status: 502 }
    )
  }

  console.log("[AI Route] OpenAI content (first 500 chars):", content.substring(0, 500))

  let parsed: AiResponse

  try {
    parsed = JSON.parse(content) as AiResponse
    console.log("[AI Route] Parsed JSON successfully:", { hasReply: !!parsed.reply, actionsCount: parsed.actions?.length })
  } catch {
    console.error("[AI Route] Failed to parse OpenAI JSON:", content)
    return NextResponse.json(
      { error: "OpenAI returned invalid JSON." },
      { status: 502 }
    )
  }

  const sanitized = sanitizeActions(parsed.actions)
  console.log("[AI Route] Sanitized actions count:", sanitized.length)

  let finalActions = sanitized.length > 0 ? sanitized : inferActionsFromPrompt(body)
  console.log("[AI Route] Final actions count:", finalActions.length, "- took path:", sanitized.length > 0 ? "OpenAI" : "Fallback")

  return NextResponse.json({
    reply: typeof parsed.reply === "string" && parsed.reply.trim() ? parsed.reply.trim() : defaultReply(body),
    actions: finalActions,
  })
}

function defaultReply(body: EditorRequest) {
  return `Let's make ${body.invitation.title} feel more alive. I can tune the hierarchy, spacing, tone, or add a page that supports the flow.`
}

function inferActionsFromPrompt(body: EditorRequest): AiAction[] {
  const prompt = body.prompt.toLowerCase()
  const activePage = body.pages.find((page) => page.id === body.activePage) ?? body.pages[0]

  if (!activePage) {
    return []
  }

  if (prompt.includes("add") || prompt.includes("create") || prompt.includes("new page") || prompt.includes("page")) {
    const pageType = inferPageType(prompt)

    if (pageType) {
      return [{
        type: "add_page",
        pageType,
        name: formatPageName(pageType),
        content: buildDefaultPageContent(pageType, body.prompt, body.invitation.title),
      }]
    }
  }

  return [{
    type: "patch_page",
    pageId: activePage.id,
    content: buildPagePatch(activePage, body.prompt, body.invitation.title),
  }]
}

function inferPageType(prompt: string): string | undefined {
  if (prompt.includes("rsvp") || prompt.includes("attendance") || prompt.includes("guest")) return "rsvp"
  if (prompt.includes("location") || prompt.includes("map") || prompt.includes("venue") || prompt.includes("address")) return "location"
  if (prompt.includes("schedule") || prompt.includes("timeline") || prompt.includes("agenda")) return "schedule"
  if (prompt.includes("gallery") || prompt.includes("photos") || prompt.includes("images")) return "gallery"
  if (prompt.includes("gift") || prompt.includes("registry")) return "gifts"
  if (prompt.includes("faq") || prompt.includes("questions")) return "faq"
  if (prompt.includes("details") || prompt.includes("info")) return "details"
  return "cover"
}

function formatPageName(pageType: string) {
  switch (pageType) {
    case "rsvp":
      return "RSVP"
    case "location":
      return "Location"
    case "schedule":
      return "Schedule"
    case "gallery":
      return "Gallery"
    case "gifts":
      return "Gifts"
    case "faq":
      return "FAQ"
    case "details":
      return "Details"
    default:
      return "Cover"
  }
}

function buildDefaultPageContent(pageType: string, prompt: string, title: string) {
  const promptSummary = summarizePrompt(prompt)
  const elements = buildPageElements(pageType, promptSummary, title)

  switch (pageType) {
    case "rsvp":
      return {
        headline: "RSVP",
        subheadline: promptSummary,
        fields: [
          { label: "Full Name", type: "text", required: true },
          { label: "Email", type: "email", required: true },
          { label: "Attendance", type: "select", required: true },
        ],
        buttons: [{ label: "Submit RSVP", action: "submit" }],
        elements,
      }
    case "location":
      return {
        headline: "Location",
        subheadline: promptSummary,
        venue: `${title} Venue`,
        address: "Add venue address here",
        directions: "Detailed directions will appear here",
        mapUrl: "https://maps.google.com",
        elements,
      }
    case "schedule":
      return {
        headline: "Schedule",
        subheadline: promptSummary,
        items: [
          { icon: "clock", label: "Arrival", value: "6:00 PM" },
          { icon: "clock", label: "Main Moment", value: "7:00 PM" },
          { icon: "clock", label: "Wrap Up", value: "9:00 PM" },
        ],
        elements,
      }
    case "gallery":
      return {
        headline: "Gallery",
        subheadline: promptSummary,
        body: "A visual collection that supports the invitation story.",
        elements,
      }
    case "gifts":
      return {
        headline: "Gift Registry",
        subheadline: promptSummary,
        body: "A simple place to share registry details or a thoughtful note.",
        elements,
      }
    case "faq":
      return {
        headline: "FAQ",
        subheadline: promptSummary,
        elements,
      }
    case "details":
      return {
        headline: "Event Details",
        subheadline: promptSummary,
        body: "Add the key information guests need to know.",
        date: "Date TBD",
        time: "Time TBD",
        location: "Location TBD",
        elements,
      }
    default:
      return {
        headline: title,
        subheadline: promptSummary,
        body: "Shape the invitation into a stronger opening moment.",
        elements,
      }
  }
}

function buildPagePatch(page: PageSummary, prompt: string, title: string) {
  const promptSummary = summarizePrompt(prompt)
  const lower = prompt.toLowerCase()
  const pageType = page.name.toLowerCase().includes("rsvp")
    ? "rsvp"
    : page.name.toLowerCase().includes("detail")
      ? "details"
      : page.name.toLowerCase().includes("location")
        ? "location"
        : page.name.toLowerCase().includes("schedule")
          ? "schedule"
          : page.name.toLowerCase().includes("gallery")
            ? "gallery"
            : page.name.toLowerCase().includes("gift")
              ? "gifts"
              : page.name.toLowerCase().includes("faq")
                ? "faq"
                : "cover"

  if (page.name.toLowerCase().includes("rsvp") || lower.includes("rsvp") || lower.includes("response")) {
    return buildDefaultPageContent("rsvp", prompt, title)
  }

  if (page.name.toLowerCase().includes("detail") || lower.includes("detail")) {
    return buildDefaultPageContent("details", prompt, title)
  }

  if (page.name.toLowerCase().includes("location") || lower.includes("location") || lower.includes("map")) {
    return buildDefaultPageContent("location", prompt, title)
  }

  return {
    headline: page.content.headline || title,
    subheadline: promptSummary,
    body: "Rebalanced for clarity, stronger hierarchy, and a more intentional tone.",
    ...(page.content.date ? { date: page.content.date } : {}),
    ...(page.content.time ? { time: page.content.time } : {}),
    ...(page.content.location ? { location: page.content.location } : {}),
    elements: buildPageElements(pageType, promptSummary, title),
  }
}

function buildPageElements(pageType: string, promptSummary: string, title: string) {
  const baseTitle = title || "Invitation"

  switch (pageType) {
    case "rsvp":
      return [
        {
          id: "rsvp-badge",
          type: "badge",
          order: 0,
          content: { label: "Response" },
          style: { justifyContent: "center" },
        },
        {
          id: "rsvp-copy",
          type: "container",
          order: 1,
          style: { textAlign: "center", gap: "0.75rem", display: "block" },
          children: [
            { id: "rsvp-title", type: "text", content: { title: "RSVP" } },
            { id: "rsvp-text", type: "text", content: { text: promptSummary } },
          ],
        },
        {
          id: "rsvp-button",
          type: "button",
          order: 2,
          content: { label: "Open RSVP" },
          style: { justifyContent: "center" },
        },
      ]
    case "location":
      return [
        {
          id: "location-image",
          type: "image",
          order: 0,
          content: { title: baseTitle, description: "Venue preview" },
          style: { height: "220px" },
        },
        {
          id: "location-copy",
          type: "container",
          order: 1,
          style: { gap: "0.75rem" },
          children: [
            { id: "location-title", type: "text", content: { title: "Location" } },
            { id: "location-body", type: "text", content: { text: promptSummary } },
          ],
        },
      ]
    case "schedule":
      return [
        { id: "schedule-badge", type: "badge", order: 0, content: { label: "Timeline" }, style: { justifyContent: "center" } },
        {
          id: "schedule-copy",
          type: "container",
          order: 1,
          style: { gap: "0.75rem" },
          children: [
            { id: "schedule-title", type: "text", content: { title: "Schedule" } },
            { id: "schedule-text", type: "text", content: { text: promptSummary } },
          ],
        },
      ]
    case "gallery":
      return [
        { id: "gallery-badge", type: "badge", order: 0, content: { label: "Gallery" }, style: { justifyContent: "center" } },
        { id: "gallery-image", type: "image", order: 1, content: { title: baseTitle, description: "Featured image" }, style: { height: "220px" } },
      ]
    case "gifts":
      return [
        { id: "gifts-badge", type: "badge", order: 0, content: { label: "Registry" }, style: { justifyContent: "center" } },
        { id: "gifts-copy", type: "text", order: 1, content: { text: promptSummary } },
      ]
    case "faq":
      return [
        { id: "faq-badge", type: "badge", order: 0, content: { label: "FAQ" }, style: { justifyContent: "center" } },
        { id: "faq-copy", type: "text", order: 1, content: { text: promptSummary } },
      ]
    case "details":
      return [
        { id: "details-badge", type: "badge", order: 0, content: { label: "Details" }, style: { justifyContent: "center" } },
        { id: "details-title", type: "text", order: 1, content: { title: "Event Details" } },
        { id: "details-text", type: "text", order: 2, content: { text: promptSummary } },
        { id: "details-divider", type: "divider", order: 3 },
      ]
    default:
      return [
        { id: "cover-badge", type: "badge", order: 0, content: { label: "Invitation" }, style: { justifyContent: "center" } },
        {
          id: "cover-copy",
          type: "container",
          order: 1,
          style: { textAlign: "center", gap: "0.75rem", display: "block" },
          children: [
            { id: "cover-title", type: "text", content: { title: baseTitle } },
            { id: "cover-text", type: "text", content: { text: promptSummary } },
          ],
        },
        { id: "cover-button", type: "button", order: 2, content: { label: "View Details" }, style: { justifyContent: "center" } },
      ]
  }
}

function summarizePrompt(prompt: string) {
  const cleaned = prompt.replace(/\s+/g, " ").trim()
  return cleaned.length > 120 ? `${cleaned.slice(0, 117)}...` : cleaned
}

function summarizeElements(elements: unknown): ElementSummary[] | undefined {
  if (!Array.isArray(elements)) return undefined

  const summaries: ElementSummary[] = []

  for (const element of elements) {
    if (!element || typeof element !== "object") continue

    const candidate = element as Record<string, unknown>
    const id = typeof candidate.id === "string" ? candidate.id : `element-${summaries.length}`
    const type = typeof candidate.type === "string" ? candidate.type : "text"
    const summary: ElementSummary = { id, type }

    if (typeof candidate.order === "number") summary.order = candidate.order
    if (candidate.content && typeof candidate.content === "object") summary.content = candidate.content as Record<string, unknown>
    if (candidate.style && typeof candidate.style === "object") summary.style = candidate.style as Record<string, unknown>
    if (Array.isArray(candidate.children)) summary.children = summarizeElements(candidate.children)

    summaries.push(summary)
  }

  return summaries
}

function sanitizeActions(actions: unknown[] | undefined): AiAction[] {
  if (!Array.isArray(actions)) return []

  const sanitized: AiAction[] = []

  for (const action of actions) {
    if (!action || typeof action !== "object") continue

    const candidate = action as Record<string, unknown>
    const type = candidate.type

    if (type === "patch_page") {
      const pageId = candidate.pageId
      const content = candidate.content
      if (typeof pageId !== "string" || !content || typeof content !== "object") continue

      sanitized.push({ type: "patch_page", pageId, content: content as Record<string, unknown> })
      continue
    }

    if (type === "add_page") {
      const pageType = candidate.pageType
      if (typeof pageType !== "string") continue

      const content = candidate.content
      sanitized.push({
        type: "add_page",
        pageType,
        name: typeof candidate.name === "string" ? candidate.name : undefined,
        content: content && typeof content === "object" ? (content as Record<string, unknown>) : undefined,
      })
      continue
    }

    if (type === "focus_page") {
      const pageId = candidate.pageId
      if (typeof pageId !== "string") continue

      sanitized.push({ type: "focus_page", pageId })
      continue
    }

    if (type === "add_element") {
      const pageId = candidate.pageId
      const element = candidate.element
      if (typeof pageId !== "string" || !element || typeof element !== "object") continue

      sanitized.push({
        type: "add_element",
        pageId,
        parentElementId: typeof candidate.parentElementId === "string" ? candidate.parentElementId : undefined,
        element: sanitizeElement(element as Record<string, unknown>) ?? { id: `element-${Date.now()}`, type: "text" },
      })
      continue
    }

    if (type === "patch_element") {
      const pageId = candidate.pageId
      const elementId = candidate.elementId
      const content = candidate.content
      if (typeof pageId !== "string" || typeof elementId !== "string" || !content || typeof content !== "object") continue

      sanitized.push({
        type: "patch_element",
        pageId,
        elementId,
        content: content as Record<string, unknown>,
      })
      continue
    }

    if (type === "remove_element") {
      const pageId = candidate.pageId
      const elementId = candidate.elementId
      if (typeof pageId !== "string" || typeof elementId !== "string") continue

      sanitized.push({ type: "remove_element", pageId, elementId })
      continue
    }

    if (type === "focus_element") {
      const pageId = candidate.pageId
      const elementId = candidate.elementId
      if (typeof pageId !== "string" || typeof elementId !== "string") continue

      sanitized.push({ type: "focus_element", pageId, elementId })
    }

  }

  return sanitized
}

function sanitizeElement(element: Record<string, unknown>): ElementSummary | undefined {
  const type = typeof element.type === "string" ? element.type : undefined
  if (!type) return undefined

  const sanitized: ElementSummary = {
    id: typeof element.id === "string" ? element.id : `element-${Date.now()}`,
    type,
  }

  if (typeof element.order === "number") sanitized.order = element.order
  if (element.content && typeof element.content === "object") sanitized.content = element.content as Record<string, unknown>
  if (element.style && typeof element.style === "object") sanitized.style = element.style as Record<string, unknown>
  if (Array.isArray(element.children)) sanitized.children = element.children
    .map((child) => (child && typeof child === "object" ? sanitizeElement(child as Record<string, unknown>) : undefined))
    .filter((child): child is ElementSummary => Boolean(child))

  return sanitized
}