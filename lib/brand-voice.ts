import { prisma } from "@/lib/prisma"

export type BrandTone = "formal" | "casual" | "playful" | "warm" | "direct"

export type BrandVoice = {
  tone?: BrandTone
  description?: string
  exampleSentences?: string[]
  signature?: string
}

function normalizeText(value: string | null | undefined) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

export function normalizeBrandTone(value: string | null | undefined): BrandTone | undefined {
  const normalized = value?.trim().toLowerCase()
  if (!normalized) {
    return undefined
  }

  switch (normalized) {
    case "formal":
    case "casual":
    case "playful":
    case "warm":
    case "direct":
      return normalized
    case "professional":
      return "formal"
    case "friendly":
      return "warm"
    case "minimal":
      return "direct"
    default:
      return undefined
  }
}

function parseExampleSentences(value: string | null | undefined) {
  if (!value) {
    return undefined
  }

  try {
    const parsed = JSON.parse(value) as unknown
    if (!Array.isArray(parsed)) {
      return undefined
    }

    const sentences = parsed
      .filter((entry): entry is string => typeof entry === "string")
      .map((entry) => entry.trim())
      .filter(Boolean)

    return sentences.length > 0 ? sentences : undefined
  } catch {
    return undefined
  }
}

export async function getUserBrandVoice(userId: string): Promise<BrandVoice | null> {
  const brand = await prisma.userBrand.findUnique({
    where: { userId },
    select: {
      toneTemplate: true,
      tone: true,
      exampleSentences: true,
      emailSignature: true,
    },
  })

  if (!brand) {
    return null
  }

  const voice: BrandVoice = {
    tone: normalizeBrandTone(brand.toneTemplate),
    description: normalizeText(brand.tone),
    exampleSentences: parseExampleSentences(brand.exampleSentences),
    signature: normalizeText(brand.emailSignature),
  }

  if (!voice.tone && !voice.description && !voice.exampleSentences?.length && !voice.signature) {
    return null
  }

  return voice
}

export function buildBrandVoicePrompt(voice: BrandVoice | null | undefined) {
  if (!voice) {
    return ""
  }

  const details: string[] = []

  if (voice.tone) {
    details.push(`Preferred tone: ${voice.tone}`)
  }

  if (voice.description) {
    details.push(`Voice description: ${voice.description}`)
  }

  if (voice.exampleSentences?.length) {
    details.push(`Example sentences: ${voice.exampleSentences.join(" ")}`)
  }

  if (voice.signature) {
    details.push(`Preferred sign-off: ${voice.signature}`)
  }

  return details.length > 0 ? details.join("\n") : ""
}