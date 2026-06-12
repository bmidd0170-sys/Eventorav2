import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthenticatedDbUser } from "@/lib/auth/server"
import { internalServerError, unauthorized } from "@/lib/api/responses"
import { ok } from "@/lib/api/success"

export type BrandSettings = {
  primaryColor?: string
  secondaryColor?: string
  accentColor?: string
  headingFont?: string
  bodyFont?: string
  logoDataUrl?: string
  defaultHeadline?: string
  defaultSubheadline?: string
  defaultCtaLabel?: string
  toneTemplate?: string
  tone?: string
  exampleSentences?: string[]
  personalityQuestionnaireAnswers?: Record<string, unknown>
  emailSignature?: string
}

function serializeSettings(brand: {
  primaryColor: string | null
  secondaryColor: string | null
  accentColor: string | null
  headingFont: string | null
  bodyFont: string | null
  logoDataUrl: string | null
  defaultHeadline: string | null
  defaultSubheadline: string | null
  defaultCtaLabel: string | null
  toneTemplate: string | null
  tone: string | null
  exampleSentences: string | null
  personalityQuestionnaireAnswers: any
  emailSignature: string | null
}): BrandSettings {
  return {
    primaryColor: brand.primaryColor || undefined,
    secondaryColor: brand.secondaryColor || undefined,
    accentColor: brand.accentColor || undefined,
    headingFont: brand.headingFont || undefined,
    bodyFont: brand.bodyFont || undefined,
    logoDataUrl: brand.logoDataUrl || undefined,
    defaultHeadline: brand.defaultHeadline || undefined,
    defaultSubheadline: brand.defaultSubheadline || undefined,
    defaultCtaLabel: brand.defaultCtaLabel || undefined,
    toneTemplate: brand.toneTemplate || undefined,
    tone: brand.tone || undefined,
    exampleSentences: brand.exampleSentences ? JSON.parse(brand.exampleSentences) : undefined,
    personalityQuestionnaireAnswers: brand.personalityQuestionnaireAnswers || undefined,
    emailSignature: brand.emailSignature || undefined,
  }
}

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedDbUser(req)
    if (!authUser) {
      return unauthorized()
    }

    const brand = await prisma.userBrand.findUnique({
      where: { userId: authUser.dbUser.id },
    })

    const settings = brand ? serializeSettings(brand) : {}

    return ok({ settings })
  } catch (error) {
    console.error("Brand settings load error:", error)
    return internalServerError("Failed to load brand settings")
  }
}

export async function PUT(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedDbUser(req)
    if (!authUser) {
      return unauthorized()
    }

    const body = (await req.json()) as BrandSettings

    const saved = await prisma.userBrand.upsert({
      where: { userId: authUser.dbUser.id },
      create: {
        userId: authUser.dbUser.id,
        primaryColor: body.primaryColor,
        secondaryColor: body.secondaryColor,
        accentColor: body.accentColor,
        headingFont: body.headingFont,
        bodyFont: body.bodyFont,
        logoDataUrl: body.logoDataUrl,
        defaultHeadline: body.defaultHeadline,
        defaultSubheadline: body.defaultSubheadline,
        defaultCtaLabel: body.defaultCtaLabel,
        toneTemplate: body.toneTemplate,
        tone: body.tone,
        exampleSentences: body.exampleSentences ? JSON.stringify(body.exampleSentences) : null,
        personalityQuestionnaireAnswers: body.personalityQuestionnaireAnswers as any,
        emailSignature: body.emailSignature,
      },
      update: {
        primaryColor: body.primaryColor,
        secondaryColor: body.secondaryColor,
        accentColor: body.accentColor,
        headingFont: body.headingFont,
        bodyFont: body.bodyFont,
        logoDataUrl: body.logoDataUrl,
        defaultHeadline: body.defaultHeadline,
        defaultSubheadline: body.defaultSubheadline,
        defaultCtaLabel: body.defaultCtaLabel,
        toneTemplate: body.toneTemplate,
        tone: body.tone,
        exampleSentences: body.exampleSentences ? JSON.stringify(body.exampleSentences) : null,
        personalityQuestionnaireAnswers: body.personalityQuestionnaireAnswers as any,
        emailSignature: body.emailSignature,
      },
    })

    return ok({ settings: serializeSettings(saved) })
  } catch (error) {
    console.error("Brand settings save error:", error)
    return internalServerError("Failed to save brand settings")
  }
}
