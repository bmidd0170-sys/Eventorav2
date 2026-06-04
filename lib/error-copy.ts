export type ErrorSeverity = "info" | "warning" | "error";

export type FriendlyError = {
  title: string;
  message: string;
  severity?: ErrorSeverity;
  code?: string;
};

const DEFAULT_ERROR: FriendlyError = {
  title: "Something went wrong",
  message:
    "We couldn't complete that action right now. Please try again in a moment.",
  severity: "error",
};

const NETWORK_ERROR: FriendlyError = {
  title: "Connection issue",
  message:
    "We couldn't reach the server. Check your internet connection and try again.",
  severity: "warning",
  code: "NETWORK_ERROR",
};

const TIMEOUT_ERROR: FriendlyError = {
  title: "Request timed out",
  message: "The request took too long. Please try again.",
  severity: "warning",
  code: "TIMEOUT",
};

const ERROR_BY_STATUS: Record<number, FriendlyError> = {
  400: {
    title: "Invalid request",
    message: "Some details look invalid. Review your input and try again.",
    severity: "warning",
    code: "BAD_REQUEST",
  },
  401: {
    title: "Please sign in",
    message: "Your session has expired. Sign in again to continue.",
    severity: "warning",
    code: "UNAUTHORIZED",
  },
  403: {
    title: "Not allowed",
    message: "You don't have permission to do that.",
    severity: "warning",
    code: "FORBIDDEN",
  },
  404: {
    title: "Not found",
    message: "The item you're looking for no longer exists.",
    severity: "info",
    code: "NOT_FOUND",
  },
  409: {
    title: "Already updated",
    message: "This information changed recently. Refresh and try again.",
    severity: "info",
    code: "CONFLICT",
  },
  422: {
    title: "Please check your input",
    message: "Some fields need attention before we can continue.",
    severity: "warning",
    code: "VALIDATION_ERROR",
  },
  429: {
    title: "Too many requests",
    message: "You're moving fast. Please wait a few seconds and retry.",
    severity: "warning",
    code: "RATE_LIMITED",
  },
  500: {
    title: "Server issue",
    message:
      "We hit a problem on our side. Please try again shortly.",
    severity: "error",
    code: "INTERNAL_SERVER_ERROR",
  },
  502: {
    title: "Service unavailable",
    message: "A backend service is unavailable. Please try again.",
    severity: "error",
    code: "BAD_GATEWAY",
  },
  503: {
    title: "Service temporarily unavailable",
    message: "We're currently unavailable. Please retry in a moment.",
    severity: "error",
    code: "SERVICE_UNAVAILABLE",
  },
  504: {
    title: "Gateway timeout",
    message: "The server took too long to respond. Please try again.",
    severity: "warning",
    code: "GATEWAY_TIMEOUT",
  },
};

type ErrorLike = {
  title?: string;
  message?: unknown;
  name?: string;
  code?: string;
  status?: number;
  severity?: ErrorSeverity;
  errors?: unknown;
};

function extractText(value: unknown): string {
  if (typeof value === "string") return value;
  if (value == null) return "";

  if (typeof value === "object") {
    const candidate = value as {
      message?: unknown;
      error?: unknown;
      code?: unknown;
      errors?: unknown;
    };

    if (typeof candidate.message === "string") return candidate.message;
    if (typeof candidate.error === "string") return candidate.error;
    if (Array.isArray(candidate.errors) && candidate.errors.length > 0) {
      const first = candidate.errors[0] as { message?: unknown };
      if (typeof first?.message === "string") return first.message;
    }
    if (typeof candidate.code === "string") {
      return `Error code: ${candidate.code}`;
    }
  }

  return "";
}

export function friendlyErrorFromStatus(status?: number): FriendlyError {
  if (!status) return DEFAULT_ERROR;
  if (ERROR_BY_STATUS[status]) return ERROR_BY_STATUS[status];
  if (status >= 500) return ERROR_BY_STATUS[500];
  if (status >= 400) return ERROR_BY_STATUS[400];
  return DEFAULT_ERROR;
}

export function toFriendlyError(error: unknown): FriendlyError {
  if (!error) return DEFAULT_ERROR;

  if (typeof error === "string") {
    if (/network|failed to fetch/i.test(error)) return NETWORK_ERROR;
    return { ...DEFAULT_ERROR, message: error };
  }

  const value = error as ErrorLike;
  if (typeof value.title === "string") {
    const explicitMessage = extractText(value.message);
    if (explicitMessage) {
      return {
        title: value.title,
        message: explicitMessage,
        severity: value.severity ?? "error",
        code: value.code,
      };
    }
  }

  const message = extractText(value.message || value.errors || error);

  if (typeof value.message === "object") {
    const nestedCode = (value.message as { code?: unknown }).code;
    if (typeof nestedCode === "string") {
      if (nestedCode === "UNAUTHORIZED") return ERROR_BY_STATUS[401];
      if (nestedCode === "FORBIDDEN") return ERROR_BY_STATUS[403];
      if (nestedCode === "NOT_FOUND") return ERROR_BY_STATUS[404];
    }
  }

  if (typeof value.title === "string" && message) {
    return {
      title: value.title,
      message,
      severity: value.severity ?? "error",
      code: value.code,
    };
  }

  if (/timeout|aborted/i.test(message) || value.code === "ETIMEDOUT") {
    return TIMEOUT_ERROR;
  }

  if (/network|failed to fetch|load failed/i.test(message)) {
    return NETWORK_ERROR;
  }

  if (typeof value.status === "number") {
    const base = friendlyErrorFromStatus(value.status);
    return { ...base, message: message || base.message };
  }

  if (value.code && typeof value.code === "string") {
    if (value.code === "UNAUTHORIZED") return ERROR_BY_STATUS[401];
    if (value.code === "FORBIDDEN") return ERROR_BY_STATUS[403];
    if (value.code === "NOT_FOUND") return ERROR_BY_STATUS[404];
  }

  if (message) return { ...DEFAULT_ERROR, message };
  return DEFAULT_ERROR;
}
