import { NextResponse } from 'next/server'
import { sendEmail } from "@/lib/email"

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
      return NextResponse.json(
        { error: 'Missing required fields: to and subject are required' },
        { status: 400 }
      )
    }

    await sendEmail(body)

    return NextResponse.json({ ok: true, message: `Email sent to ${body.to}` })
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    console.error('[/api/send-email] Email sending failed:', {
      error: errorMsg,
      stack: err instanceof Error ? err.stack : undefined,
    })
    return NextResponse.json(
      {
        error: 'Failed to send email',
        details: errorMsg,
      },
      { status: 500 }
    )
  }
}
