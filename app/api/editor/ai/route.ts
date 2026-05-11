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

const defaultModel = process.env.OPENAI_MODEL || "gpt-4.1-mini"

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY

  let body: EditorRequest

  try {
    body = (await req.json()) as EditorRequest
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 })
  }

  if (!apiKey) {
    return NextResponse.json({
      reply: defaultReply(body),
      actions: [],
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
- When asked to improve copy, layout, hierarchy, motion, spacing, or tone, return actionable changes.
- When the request is about a specific page, use patch_page for that page.
- When the request clearly asks for a new page, use add_page with one of: cover, details, rsvp, location, schedule, gallery, gifts, faq.
- When the request is about the invitation canvas itself, use add_element, patch_element, remove_element, or focus_element.
- Element types you can use: container, text, image, button, badge, divider, spacer.
- Use containers to group nested elements with children and use order to control stacking.
- Use focus_page if the user should be directed to a specific page.
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

  if (!response.ok) {
    const details = await response.text()
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

  const content = data.choices?.[0]?.message?.content

  if (!content) {
    return NextResponse.json(
      { error: "OpenAI returned an empty response." },
      { status: 502 }
    )
  }

  let parsed: AiResponse

  try {
    parsed = JSON.parse(content) as AiResponse
  } catch {
    return NextResponse.json(
      { error: "OpenAI returned invalid JSON." },
      { status: 502 }
    )
  }

  return NextResponse.json({
    reply: typeof parsed.reply === "string" && parsed.reply.trim() ? parsed.reply.trim() : defaultReply(body),
    actions: sanitizeActions(parsed.actions),
  })
}

function defaultReply(body: EditorRequest) {
  return `Let's make ${body.invitation.title} feel more alive. I can tune the hierarchy, spacing, tone, or add a page that supports the flow.`
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