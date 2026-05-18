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
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    await sendEmail(body)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Send email error:', err)
    return NextResponse.json({ error: 'Failed to send' }, { status: 500 })
  }
}
