#!/usr/bin/env node
require('dotenv').config({ path: './.env' })
const nodemailer = require('nodemailer')

async function main() {
  const host = process.env.SMTP_HOST
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587
  const secure = (process.env.SMTP_SECURE === 'true')
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  const from = process.env.SMTP_FROM || user
  const to = user // send test to the SMTP user address

  if (!host || !user || !pass) {
    console.error('Missing SMTP_HOST, SMTP_USER, or SMTP_PASS in .env')
    process.exit(1)
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  })

  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject: 'Eventora SMTP test',
      text: 'This is a test email sent from Eventora test script.',
      html: '<p>This is a <strong>test email</strong> sent from Eventora test script.</p>',
    })
    console.log('Message sent:', info && info.messageId ? info.messageId : info)
    process.exit(0)
  } catch (err) {
    console.error('Send failed:', err)
    process.exit(2)
  }
}

main()
