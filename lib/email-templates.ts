type EmailTemplate = {
    subject: string
    text: string
    html: string
}

type EmailTone = "formal" | "casual" | "playful" | "warm" | "direct"

function escapeHtml(value: string) {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;")
}

function normalizeSignature(signature?: string | null) {
    const trimmed = signature?.trim()
    return trimmed ? trimmed : undefined
}

function signatureHtml(signature?: string | null) {
    const normalized = normalizeSignature(signature)
    if (!normalized) {
        return ""
    }

    const lines = normalized
        .split(/\r?\n/)
        .map((line) => escapeHtml(line))
        .join("<br>")

    return `<div style="margin-top:24px;padding-top:18px;border-top:1px solid rgba(255,255,255,0.12);"><p style="margin:0;color:#f8fafc;white-space:normal;">${lines}</p></div>`
}

export function appendEmailSignatureText(text: string, signature?: string | null) {
    const normalized = normalizeSignature(signature)
    return normalized ? `${text}\n\n${normalized}` : text
}

export function appendEmailSignatureHtml(html: string, signature?: string | null) {
    const normalized = normalizeSignature(signature)
    if (!normalized) {
        return html
    }

    const lines = normalized
        .split(/\r?\n/)
        .map((line) => escapeHtml(line))
        .join("<br>")

    return `${html}<p style="margin-top:20px;">${lines}</p>`
}

function baseHtml(options: { eyebrow: string; headline: string; body: string; ctaLabel?: string; ctaUrl?: string; signature?: string }) {
    const eyebrow = escapeHtml(options.eyebrow)
    const headline = escapeHtml(options.headline)

    return `
    <div style="margin:0;padding:0;background:#0b1020;font-family:Arial,Helvetica,sans-serif;color:#e5e7eb;">
      <div style="max-width:640px;margin:0 auto;padding:32px 20px;">
        <div style="border:1px solid rgba(255,255,255,0.08);border-radius:24px;overflow:hidden;background:linear-gradient(180deg,#111827 0%,#0b1020 100%);box-shadow:0 20px 60px rgba(0,0,0,.35);">
          <div style="padding:28px 28px 12px;">
            <div style="display:inline-flex;align-items:center;gap:8px;padding:6px 12px;border-radius:999px;background:rgba(59,130,246,.12);color:#93c5fd;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;">
              ${eyebrow}
            </div>
            <h1 style="margin:18px 0 12px;font-size:28px;line-height:1.2;color:#ffffff;">${headline}</h1>
          </div>
          <div style="padding:0 28px 28px;color:#cbd5e1;font-size:16px;line-height:1.7;">
            ${options.body}
            ${options.ctaLabel && options.ctaUrl ? `<div style="margin-top:24px;"><a href="${escapeHtml(options.ctaUrl)}" style="display:inline-block;padding:12px 18px;border-radius:14px;background:#2563eb;color:#ffffff;text-decoration:none;font-weight:700;">${escapeHtml(options.ctaLabel)}</a></div>` : ""}
                        ${signatureHtml(options.signature)}
          </div>
        </div>
      </div>
    </div>
  `
}

export function buildWelcomeEmail(displayNameOrEmail: string): EmailTemplate {
    const safeName = displayNameOrEmail.trim() || "there"
    return {
        subject: `Welcome to Invyra, ${safeName}!`,
        text: `Welcome to Invyra, ${safeName}! We are glad you are here. Start by creating your first invitation and exploring the tutorial if you have not already finished it.`,
        html: baseHtml({
            eyebrow: "Welcome",
            headline: `Welcome to Invyra, ${escapeHtml(safeName)}!`,
            body: `<p>We are glad you joined Invyra.</p><p>Start by creating your first invitation, then walk through the tutorial to learn the builder, publish flow, and guest tools.</p>`,
            ctaLabel: "Create your first event",
            ctaUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/builder`,
        }),
    }
}

export function buildTutorialCompleteEmail(displayNameOrEmail: string): EmailTemplate {
    const safeName = displayNameOrEmail.trim() || "there"
    return {
        subject: `Tutorial complete - you are ready to build, ${safeName}`,
        text: `Nice work, ${safeName}. You finished the Invyra tutorial and are ready to create invitations, publish events, and manage RSVPs.`,
        html: baseHtml({
            eyebrow: "Tutorial complete",
            headline: `You finished the tutorial, ${escapeHtml(safeName)}`,
            body: `<p>Nice work. You have finished the Invyra tutorial and are ready to build invitations, publish events, and manage RSVPs.</p>`,
            ctaLabel: "Open your dashboard",
            ctaUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard`,
        }),
    }
}

export function buildRsvpUpdateEmail(options: {
    eventTitle: string
    responseLabel: string
    guestEmail: string
    guestName?: string | null
    eventUrl?: string
}): EmailTemplate {
    const guestLabel = options.guestName?.trim() || options.guestEmail
    return {
        subject: `${guestLabel} RSVP'd ${options.responseLabel.toLowerCase()} for ${options.eventTitle}`,
        text: `${guestLabel} responded ${options.responseLabel.toLowerCase()} to ${options.eventTitle}.`,
        html: baseHtml({
            eyebrow: "RSVP update",
            headline: `${escapeHtml(guestLabel)} RSVP'd ${escapeHtml(options.responseLabel.toLowerCase())}`,
            body: `<p><strong>${escapeHtml(guestLabel)}</strong> responded <strong>${escapeHtml(options.responseLabel.toLowerCase())}</strong> to <strong>${escapeHtml(options.eventTitle)}</strong>.</p><p>Email: ${escapeHtml(options.guestEmail)}</p>`,
            ctaLabel: options.eventUrl ? "View event" : undefined,
            ctaUrl: options.eventUrl,
        }),
    }
}

export function buildRsvpConfirmationEmail(options: {
    eventTitle: string
    responseLabel: string
    guestEmail: string
    guestName?: string | null
    eventUrl?: string
    tone?: EmailTone
    signature?: string
}): EmailTemplate {
    const guestLabel = options.guestName?.trim() || options.guestEmail
    const tone = options.tone || "formal"
    
    let headline = ""
    let body = ""
    let thankYouMessage = ""
    
    switch (tone) {
        case "casual":
            headline = `Got it, ${escapeHtml(guestLabel)} – thanks!`
            thankYouMessage = `Your ${escapeHtml(options.responseLabel.toLowerCase())} RSVP is all set.`
            body = `<p>Your ${escapeHtml(options.responseLabel.toLowerCase())} RSVP for <strong>${escapeHtml(options.eventTitle)}</strong> is locked in.</p><p>Can't wait to see you there!</p>`
            break
        case "playful":
            headline = `You're ${escapeHtml(options.responseLabel.toLowerCase())}ing! 🎉`
            thankYouMessage = `Awesome! Your RSVP for ${escapeHtml(options.eventTitle)} is confirmed.`
            body = `<p>Your ${escapeHtml(options.responseLabel.toLowerCase())} RSVP for <strong>${escapeHtml(options.eventTitle)}</strong> is officially on the books.</p><p>Let's make this event incredible!</p>`
            break
        case "warm":
            headline = `We're so glad you'll be there, ${escapeHtml(guestLabel)}`
            thankYouMessage = `Your RSVP has been received.`
            body = `<p>Thank you for confirming your ${escapeHtml(options.responseLabel.toLowerCase())} RSVP for <strong>${escapeHtml(options.eventTitle)}</strong>.</p><p>We're looking forward to seeing you!</p>`
            break
        case "direct":
            headline = `RSVP confirmed: ${escapeHtml(options.responseLabel)}`
            thankYouMessage = `Your response has been recorded.`
            body = `<p>Your ${escapeHtml(options.responseLabel.toLowerCase())} RSVP for ${escapeHtml(options.eventTitle)} is confirmed.</p>`
            break
        default: // formal
            headline = `Thanks ${escapeHtml(guestLabel)}`
            thankYouMessage = `Your ${escapeHtml(options.responseLabel.toLowerCase())} RSVP for ${escapeHtml(options.eventTitle)} was received.`
            body = `<p>Your <strong>${escapeHtml(options.responseLabel.toLowerCase())}</strong> RSVP for <strong>${escapeHtml(options.eventTitle)}</strong> has been received.</p>`
    }
    
    return {
        subject: thankYouMessage,
        text: appendEmailSignatureText(thankYouMessage, options.signature),
        html: baseHtml({
            eyebrow: "RSVP received",
            headline,
            body,
            ctaLabel: options.eventUrl ? "View invitation" : undefined,
            ctaUrl: options.eventUrl,
            signature: options.signature,
        }),
    }
}

export function buildConnectionRequestOutgoingEmail(options: {
    fromName: string
    fromEmail: string
    toName?: string | null
}): EmailTemplate {
    const recipient = options.toName?.trim() || "your connection"
    return {
        subject: `Connection request sent to ${recipient}`,
        text: `Your connection request to ${recipient} is pending on Invyra. We will let you know when it is accepted.`,
        html: baseHtml({
            eyebrow: "Connection request",
            headline: `Request sent to ${escapeHtml(recipient)}`,
            body: `<p>Your connection request from <strong>${escapeHtml(options.fromName)}</strong> (${escapeHtml(options.fromEmail)}) is now pending.</p><p>We will notify you when it is accepted.</p>`,
        }),
    }
}

export function buildConnectionRequestIncomingEmail(options: {
    fromName: string
    fromEmail: string
    toName?: string | null
}): EmailTemplate {
    const recipient = options.toName?.trim() || "there"
    return {
        subject: `${options.fromName} sent you a connection request`,
        text: `${options.fromName} (${options.fromEmail}) wants to connect with you on Invyra.`,
        html: baseHtml({
            eyebrow: "New request",
            headline: `${escapeHtml(options.fromName)} wants to connect`,
            body: `<p>Hi ${escapeHtml(recipient)},</p><p><strong>${escapeHtml(options.fromName)}</strong> (${escapeHtml(options.fromEmail)}) sent you a connection request on Invyra.</p>`,
        }),
    }
}

export function buildConnectionRequestAcceptedEmail(options: {
    senderName: string
    senderEmail: string
    recipientName: string
    recipientEmail: string
    viewer: "sender" | "recipient"
}): EmailTemplate {
    const otherPerson = options.viewer === "sender" ? options.recipientName : options.senderName
    return {
        subject: options.viewer === "sender"
            ? `${options.recipientName} accepted your connection request`
            : `You accepted ${options.senderName}'s connection request`,
        text: options.viewer === "sender"
            ? `${options.recipientName} accepted your connection request on Invyra.`
            : `You accepted ${options.senderName}'s connection request on Invyra.`,
        html: baseHtml({
            eyebrow: "Connection accepted",
            headline: options.viewer === "sender"
                ? `${escapeHtml(options.recipientName)} accepted your request`
                : `You are now connected with ${escapeHtml(otherPerson)}`,
            body: options.viewer === "sender"
                ? `<p><strong>${escapeHtml(options.recipientName)}</strong> accepted your connection request on Invyra.</p>`
                : `<p>You accepted <strong>${escapeHtml(options.senderName)}</strong>'s connection request on Invyra.</p>`,
        }),
    }
}

export function buildEventReminderEmail(options: {
    eventTitle: string
    eventDateLabel: string
    eventTimeLabel: string
    eventUrl?: string
    tone?: EmailTone
    signature?: string
}): EmailTemplate {
    const tone = options.tone || "formal"
    
    let headline = ""
    let body = ""
    let subject = ""
    
    switch (tone) {
        case "casual":
            subject = `Don't forget – ${options.eventTitle} is tomorrow!`
            headline = `${escapeHtml(options.eventTitle)} is coming up`
            body = `<p>Just a heads up – your event is happening <strong>${escapeHtml(options.eventDateLabel)}</strong> at <strong>${escapeHtml(options.eventTimeLabel)}</strong>.</p><p>Time to get excited!</p>`
            break
        case "playful":
            subject = `🚨 ${options.eventTitle} – it's almost here!`
            headline = `${escapeHtml(options.eventTitle)} is happening soon!`
            body = `<p>Your event is <strong>${escapeHtml(options.eventDateLabel)}</strong> at <strong>${escapeHtml(options.eventTimeLabel)}</strong>.</p><p>Are you ready? We are! 🎉</p>`
            break
        case "warm":
            subject = `Reminder: ${options.eventTitle} is just around the corner`
            headline = `${escapeHtml(options.eventTitle)} is coming up soon`
            body = `<p>We hope you're excited – your event is scheduled for <strong>${escapeHtml(options.eventDateLabel)}</strong> at <strong>${escapeHtml(options.eventTimeLabel)}</strong>.</p><p>Take a final look to make sure everything is perfect.</p>`
            break
        case "direct":
            subject = `Reminder: ${options.eventTitle} – ${options.eventDateLabel} at ${options.eventTimeLabel}`
            headline = `${escapeHtml(options.eventTitle)} reminder`
            body = `<p>Event: ${escapeHtml(options.eventTitle)}</p><p>Date: ${escapeHtml(options.eventDateLabel)}</p><p>Time: ${escapeHtml(options.eventTimeLabel)}</p>`
            break
        default: // formal
            subject = `Reminder: ${options.eventTitle} is coming up soon`
            headline = `${escapeHtml(options.eventTitle)} is coming up soon`
            body = `<p>Your event is scheduled for <strong>${escapeHtml(options.eventDateLabel)}</strong> at <strong>${escapeHtml(options.eventTimeLabel)}</strong>.</p><p>Use this reminder to follow up with guests or finish your final checks.</p>`
    }
    
    return {
        subject,
        text: appendEmailSignatureText(`${options.eventTitle} is coming up on ${options.eventDateLabel} at ${options.eventTimeLabel}.`, options.signature),
        html: baseHtml({
            eyebrow: "Event reminder",
            headline,
            body,
            ctaLabel: options.eventUrl ? "Open event" : undefined,
            ctaUrl: options.eventUrl,
            signature: options.signature,
        }),
    }
}

export function buildEventCancelledEmail(options: {
    eventTitle: string
    eventDateLabel: string
    eventTimeLabel: string
    eventUrl?: string
    tone?: EmailTone
    signature?: string
}): EmailTemplate {
    const tone = options.tone || "formal"
    
    let headline = ""
    let body = ""
    let subject = ""
    
    switch (tone) {
        case "casual":
            subject = `Quick update: ${options.eventTitle} isn't happening`
            headline = `${escapeHtml(options.eventTitle)} has been called off`
            body = `<p>We wanted to let you know that ${escapeHtml(options.eventTitle)} (scheduled for ${escapeHtml(options.eventDateLabel)} at ${escapeHtml(options.eventTimeLabel)}) is no longer happening.</p><p>Sorry about that – stay tuned for future events!</p>`
            break
        case "playful":
            subject = `Plot twist: ${options.eventTitle} is off`
            headline = `${escapeHtml(options.eventTitle)} isn't happening 📅`
            body = `<p>Just wanted to give you the heads up – ${escapeHtml(options.eventTitle)} (${escapeHtml(options.eventDateLabel)}) is canceled.</p><p>We'll be back with something better soon!</p>`
            break
        case "warm":
            subject = `An important update about ${options.eventTitle}`
            headline = `${escapeHtml(options.eventTitle)} has been canceled`
            body = `<p>We're reaching out to let you know that ${escapeHtml(options.eventTitle)} has been canceled.</p><p>Thank you for your understanding. We look forward to seeing you at future events.</p>`
            break
        case "direct":
            subject = `Canceled: ${options.eventTitle}`
            headline = `${escapeHtml(options.eventTitle)} has been canceled`
            body = `<p>Event: ${escapeHtml(options.eventTitle)}</p><p>Scheduled: ${escapeHtml(options.eventDateLabel)} at ${escapeHtml(options.eventTimeLabel)}</p><p>Status: Canceled</p>`
            break
        default: // formal
            subject = `${options.eventTitle} has been canceled`
            headline = `${escapeHtml(options.eventTitle)} has been canceled`
            body = `<p>The event scheduled for <strong>${escapeHtml(options.eventDateLabel)}</strong> at <strong>${escapeHtml(options.eventTimeLabel)}</strong> is no longer happening.</p><p>We will keep the invitation record closed out on Invyra.</p>`
    }
    
    return {
        subject,
        text: appendEmailSignatureText(`${options.eventTitle} scheduled for ${options.eventDateLabel} at ${options.eventTimeLabel} has been canceled.`, options.signature),
        html: baseHtml({
            eyebrow: "Event canceled",
            headline,
            body,
            ctaLabel: options.eventUrl ? "Review event" : undefined,
            ctaUrl: options.eventUrl,
            signature: options.signature,
        }),
    }
}

export function buildEventUnpublishedEmail(options: {
    eventTitle: string
    eventUrl?: string
    signature?: string
}) {
    return {
        subject: `${options.eventTitle} is no longer published`,
        text: appendEmailSignatureText(`${options.eventTitle} has been unpublished and is no longer live.`, options.signature),
        html: baseHtml({
            eyebrow: "Event update",
            headline: `${escapeHtml(options.eventTitle)} is no longer live`,
            body: `<p>The event has been unpublished and is no longer available to new guests.</p><p>You can check back later if it is republished.</p>`,
            ctaLabel: options.eventUrl ? "Open dashboard" : undefined,
            ctaUrl: options.eventUrl,
            signature: options.signature,
        }),
    }
}

export function buildAppUpdateEmail(options: {
    headline: string
    summary: string
    eventUrl?: string
}): EmailTemplate {
    return {
        subject: options.headline,
        text: options.summary,
        html: baseHtml({
            eyebrow: "Product update",
            headline: options.headline,
            body: `<p>${escapeHtml(options.summary)}</p>`,
            ctaLabel: options.eventUrl ? "See what changed" : undefined,
            ctaUrl: options.eventUrl,
        }),
    }
}
