import nodemailer from 'nodemailer'
import { NextResponse } from 'next/server'

type ReqBody = {
  to: string
  subject: string
  text?: string
  html?: string
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ReqBody
    if (!body?.to || !body?.subject) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@example.com'

    await transporter.sendMail({
      from,
      to: body.to,
      subject: body.subject,
      text: body.text,
      html: body.html,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Send email error:', err)
    return NextResponse.json({ error: 'Failed to send' }, { status: 500 })
  }
}
