const defaultErrorMessage = "Something went wrong. Please try again."

const statusMessages: Record<number, string> = {
  400: "Please check your details and try again.",
  401: "Your session ended. Sign in again and retry.",
  403: "You don't have permission to do that.",
  404: "We couldn't find that item.",
  409: "That item already exists or is already in use.",
  422: "Some of the information you entered is invalid.",
  429: "You're doing that too quickly. Please wait a moment and try again.",
  500: "We hit a server issue. Please try again in a moment.",
  502: "The service is temporarily unavailable.",
  503: "The service is temporarily unavailable.",
}

const messageRewrites: Array<[RegExp, string]> = [
  [/^unauthorized$/i, statusMessages[401]],
  [/^invalid token$/i, statusMessages[401]],
  [/^forbidden$/i, statusMessages[403]],
  [/^auth\/invalid-credential$/i, "We couldn't sign you in with that email and password."],
  [/^firebase: error \(auth\/invalid-credential\)\.?$/i, "We couldn't sign you in with that email and password."],
  [/^not found$/i, statusMessages[404]],
  [/^missing /i, "Please fill in all required fields and try again."],
  [/already connected/i, "You're already connected with this person."],
  [/cannot connect with yourself/i, "You can't connect with yourself."],
  [/no user found/i, "We couldn't find an account with that email."],
  [/request not found/i, "That request is no longer available."],
  [/requires-recent-login/i, "Please sign in again before continuing."],
  [/email already in use/i, "That email is already registered."],
  [/weak password/i, "Please choose a stronger password."],
  [/user not found/i, "We couldn't find an account with those details."],
  [/too many requests/i, "Too many attempts. Please wait a moment and try again."],
]

function extractMessage(error: unknown) {
  if (typeof error === "string") {
    return error
  }

  if (error instanceof Error) {
    return error.message
  }

  if (error && typeof error === "object") {
    const maybeError = error as { message?: unknown; error?: unknown; details?: unknown; code?: unknown }

    if (typeof maybeError.message === "string") {
      return maybeError.message
    }

    if (typeof maybeError.error === "string") {
      return maybeError.error
    }

    if (typeof maybeError.details === "string") {
      return maybeError.details
    }

    if (typeof maybeError.code === "string") {
      return maybeError.code
    }
  }

  return ""
}

function mapKnownMessage(message: string) {
  const normalized = message.trim()

  for (const [pattern, friendlyMessage] of messageRewrites) {
    if (pattern.test(normalized)) {
      return friendlyMessage
    }
  }

  return normalized
}

export function getFriendlyErrorMessage(error: unknown, fallback = defaultErrorMessage) {
  const rawMessage = extractMessage(error)

  if (!rawMessage) {
    return fallback
  }

  if (rawMessage.startsWith("auth/")) {
    return mapKnownMessage(rawMessage)
  }

  const friendlyMessage = mapKnownMessage(rawMessage)

  if (friendlyMessage && friendlyMessage !== rawMessage) {
    return friendlyMessage
  }

  return rawMessage || fallback
}

export async function getFriendlyResponseMessage(response: Response, fallback = defaultErrorMessage) {
  try {
    const contentType = response.headers.get("content-type") ?? ""

    if (contentType.includes("application/json")) {
      const payload = (await response.clone().json()) as {
        error?: unknown
        message?: unknown
        details?: unknown
      }

      const message = getFriendlyErrorMessage(payload.error ?? payload.message ?? payload.details ?? "", fallback)

      if (message) {
        return mapResponseStatus(message, response.status, fallback)
      }
    }

    const text = (await response.clone().text()).trim()
    if (text && !text.startsWith("<!DOCTYPE html") && !text.startsWith("<html")) {
      return mapResponseStatus(getFriendlyErrorMessage(text, fallback), response.status, fallback)
    }
  } catch {
    // Fall through to the status-based fallback below.
  }

  return mapResponseStatus(fallback, response.status, fallback)
}

function mapResponseStatus(message: string, status: number, fallback: string) {
  const statusMessage = statusMessages[status]

  if (statusMessage) {
    if (!message || message === defaultErrorMessage || /^failed to/i.test(message)) {
      return statusMessage
    }
  }

  return message || statusMessage || fallback
}