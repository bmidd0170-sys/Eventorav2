import nodemailer from "nodemailer"

type Mail = {
    to: string
    subject: string
    text?: string
    html?: string
    fromName?: string
}

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT ? Number.parseInt(process.env.SMTP_PORT) : 587,
    secure: process.env.SMTP_SECURE === "true",
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
})

export async function sendEmail(mail: Mail) {
    try {
        const from = process.env.SMTP_FROM || process.env.SMTP_USER || "no-reply@example.com"
        const fromName = mail.fromName || process.env.SMTP_FROM_NAME || "Invyra"
        const fromFormatted = `"${fromName}" <${from}>`

        // Validate SMTP configuration
        if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
            throw new Error("SMTP credentials are not configured")
        }

        // Validate recipient email
        if (!mail.to || !mail.to.includes("@")) {
            throw new Error(`Invalid recipient email: ${mail.to}`)
        }

        await transporter.sendMail({
            from: fromFormatted,
            to: mail.to,
            subject: mail.subject,
            text: mail.text,
            html: mail.html,
        })
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error)
        console.error(`[sendEmail] Failed to send email to ${mail.to}:`, errorMsg)
        throw error
    }
}
