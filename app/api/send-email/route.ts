import { NextResponse } from 'next/server'
import { sendEmail } from "@/lib/email"
import { badRequest, internalServerError } from "@/lib/api/responses"
import { ok } from "@/lib/api/success"

type ReqBody = {
  to: string
  subject: string
  text?: string
  html?: string
  fromName?: string
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ReqBody
    if (!body?.to || !body?.subject) {
      return badRequest('Missing required fields: to and subject are required')
    }

    await sendEmail(body)

    return ok({ message: `Email sent to ${body.to}` })
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    console.error('[/api/send-email] Email sending failed:', {
      error: errorMsg,
      stack: err instanceof Error ? err.stack : undefined,
    })
    return internalServerError('Failed to send email', { details: errorMsg })
  }
}
