type EmailTemplate = {
  subject: string
  text: string
  html: string
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

function baseHtml(options: { eyebrow: string; headline: string; body: string; ctaLabel?: string; ctaUrl?: string }) {
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
          </div>
        </div>
      </div>
    </div>
  `
}

export function buildWelcomeEmail(displayNameOrEmail: string): EmailTemplate {
  const safeName = displayNameOrEmail.trim() || "there"
  return {
    subject: `Welcome to Eventora, ${safeName}!`,
    text: `Welcome to Eventora, ${safeName}! We are glad you are here. Start by creating your first invitation and exploring the tutorial if you have not already finished it.`,
    html: baseHtml({
      eyebrow: "Welcome",
      headline: `Welcome to Eventora, ${escapeHtml(safeName)}!`,
      body: `<p>We are glad you joined Eventora.</p><p>Start by creating your first invitation, then walk through the tutorial to learn the builder, publish flow, and guest tools.</p>`,
      ctaLabel: "Create your first event",
      ctaUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/builder`,
    }),
  }
}

export function buildTutorialCompleteEmail(displayNameOrEmail: string): EmailTemplate {
  const safeName = displayNameOrEmail.trim() || "there"
  return {
    subject: `Tutorial complete - you are ready to build, ${safeName}`,
    text: `Nice work, ${safeName}. You finished the Eventora tutorial and are ready to create invitations, publish events, and manage RSVPs.`,
    html: baseHtml({
      eyebrow: "Tutorial complete",
      headline: `You finished the tutorial, ${escapeHtml(safeName)}`,
      body: `<p>Nice work. You have finished the Eventora tutorial and are ready to build invitations, publish events, and manage RSVPs.</p>`,
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
}): EmailTemplate {
  const guestLabel = options.guestName?.trim() || options.guestEmail
  return {
    subject: `Your RSVP for ${options.eventTitle} was received`,
    text: `Thanks ${guestLabel}. Your ${options.responseLabel.toLowerCase()} RSVP for ${options.eventTitle} was received.`,
    html: baseHtml({
      eyebrow: "RSVP received",
      headline: `Thanks ${escapeHtml(guestLabel)}`,
      body: `<p>Your <strong>${escapeHtml(options.responseLabel.toLowerCase())}</strong> RSVP for <strong>${escapeHtml(options.eventTitle)}</strong> has been received.</p>`,
      ctaLabel: options.eventUrl ? "View invitation" : undefined,
      ctaUrl: options.eventUrl,
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
    text: `Your connection request to ${recipient} is pending on Eventora. We will let you know when it is accepted.`,
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
    text: `${options.fromName} (${options.fromEmail}) wants to connect with you on Eventora.`,
    html: baseHtml({
      eyebrow: "New request",
      headline: `${escapeHtml(options.fromName)} wants to connect`,
      body: `<p>Hi ${escapeHtml(recipient)},</p><p><strong>${escapeHtml(options.fromName)}</strong> (${escapeHtml(options.fromEmail)}) sent you a connection request on Eventora.</p>`,
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
      ? `${options.recipientName} accepted your connection request on Eventora.`
      : `You accepted ${options.senderName}'s connection request on Eventora.`,
    html: baseHtml({
      eyebrow: "Connection accepted",
      headline: options.viewer === "sender"
        ? `${escapeHtml(options.recipientName)} accepted your request`
        : `You are now connected with ${escapeHtml(otherPerson)}`,
      body: options.viewer === "sender"
        ? `<p><strong>${escapeHtml(options.recipientName)}</strong> accepted your connection request on Eventora.</p>`
        : `<p>You accepted <strong>${escapeHtml(options.senderName)}</strong>'s connection request on Eventora.</p>`,
    }),
  }
}

export function buildEventReminderEmail(options: {
  eventTitle: string
  eventDateLabel: string
  eventTimeLabel: string
  eventUrl?: string
}): EmailTemplate {
  return {
    subject: `Reminder: ${options.eventTitle} is coming up soon`,
    text: `${options.eventTitle} is coming up on ${options.eventDateLabel} at ${options.eventTimeLabel}.`,
    html: baseHtml({
      eyebrow: "Event reminder",
      headline: `${escapeHtml(options.eventTitle)} is coming up soon`,
      body: `<p>Your event is scheduled for <strong>${escapeHtml(options.eventDateLabel)}</strong> at <strong>${escapeHtml(options.eventTimeLabel)}</strong>.</p><p>Use this reminder to follow up with guests or finish your final checks.</p>`,
      ctaLabel: options.eventUrl ? "Open event" : undefined,
      ctaUrl: options.eventUrl,
    }),
  }
}

export function buildEventCancelledEmail(options: {
  eventTitle: string
  eventDateLabel: string
  eventTimeLabel: string
  eventUrl?: string
}): EmailTemplate {
  return {
    subject: `${options.eventTitle} has been canceled`,
    text: `${options.eventTitle} scheduled for ${options.eventDateLabel} at ${options.eventTimeLabel} has been canceled.`,
    html: baseHtml({
      eyebrow: "Event canceled",
      headline: `${escapeHtml(options.eventTitle)} has been canceled`,
      body: `<p>The event scheduled for <strong>${escapeHtml(options.eventDateLabel)}</strong> at <strong>${escapeHtml(options.eventTimeLabel)}</strong> is no longer happening.</p><p>We will keep the invitation record closed out on Eventora.</p>`,
      ctaLabel: options.eventUrl ? "Review event" : undefined,
      ctaUrl: options.eventUrl,
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
