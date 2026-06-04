"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  friendlyErrorFromStatus,
  toFriendlyError,
  type FriendlyError,
} from "@/lib/error-copy";

type PopupError = FriendlyError & {
  id: string;
};

type ErrorPopupContextValue = {
  showError: (error: unknown) => void;
  clearError: () => void;
};

const ErrorPopupContext = createContext<ErrorPopupContextValue | null>(null);

function asMessage(value: unknown): string {
  if (typeof value === "string") return value;
  if (!value || typeof value !== "object") return "";

  const maybe = value as {
    message?: unknown;
    error?: unknown;
    code?: unknown;
    errors?: Array<{ message?: unknown }>;
  };

  if (typeof maybe.message === "string") return maybe.message;
  if (typeof maybe.error === "string") return maybe.error;
  if (Array.isArray(maybe.errors) && maybe.errors.length > 0) {
    const first = maybe.errors[0];
    if (typeof first?.message === "string") return first.message;
  }
  if (typeof maybe.code === "string") return `Error code: ${maybe.code}`;
  return "";
}

function createId() {
  return `err_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function ErrorPopupProvider({ children }: { children: ReactNode }) {
  const [currentError, setCurrentError] = useState<PopupError | null>(null);

  const clearError = useCallback(() => {
    setCurrentError(null);
  }, []);

  const showError = useCallback((error: unknown) => {
    const friendly = toFriendlyError(error);
    setCurrentError({ ...friendly, id: createId() });
  }, []);

  useEffect(() => {
    if (!currentError) return;
    const timer = window.setTimeout(() => setCurrentError(null), 7000);
    return () => window.clearTimeout(timer);
  }, [currentError]);

  useEffect(() => {
    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      showError(event.reason);
    };

    const onError = (event: ErrorEvent) => {
      showError(event.error ?? event.message);
    };

    window.addEventListener("unhandledrejection", onUnhandledRejection);
    window.addEventListener("error", onError);

    return () => {
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
      window.removeEventListener("error", onError);
    };
  }, [showError]);

  useEffect(() => {
    const originalFetch = window.fetch.bind(window);

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const response = await originalFetch(input, init);

      if (!response.ok) {
        const base = friendlyErrorFromStatus(response.status);
        let message = base.message;

        try {
          const clone = response.clone();
          const contentType = clone.headers.get("content-type") ?? "";
          if (contentType.includes("application/json")) {
            const payload = (await clone.json()) as {
              error?: unknown;
              message?: unknown;
              errors?: unknown;
              code?: unknown;
            };
            message =
              asMessage(payload.message) ||
              asMessage(payload.error) ||
              asMessage(payload) ||
              message;
          }
        } catch {
          // Keep base message when response payload cannot be parsed.
        }

        showError({ ...base, message, status: response.status });
      }

      return response;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [showError]);

  const value = useMemo(
    () => ({
      showError,
      clearError,
    }),
    [showError, clearError]
  );

  return (
    <ErrorPopupContext.Provider value={value}>
      {children}
      <ErrorPopup error={currentError} onClose={clearError} />
    </ErrorPopupContext.Provider>
  );
}

export function useErrorPopup() {
  const context = useContext(ErrorPopupContext);
  if (!context) {
    throw new Error("useErrorPopup must be used within ErrorPopupProvider");
  }
  return context;
}

function ErrorPopup({
  error,
  onClose,
}: {
  error: PopupError | null;
  onClose: () => void;
}) {
  if (!error) return null;

  const accentClass =
    error.severity === "info"
      ? "border-sky-500/60"
      : error.severity === "warning"
      ? "border-amber-500/60"
      : "border-rose-500/60";

  return (
    <div className="pointer-events-none fixed inset-0 z-[120] flex items-start justify-center p-4 sm:justify-end sm:p-6">
      <div
        role="alert"
        aria-live="assertive"
        className={`pointer-events-auto w-full max-w-md rounded-2xl border bg-neutral-950/95 p-4 text-white shadow-2xl backdrop-blur ${accentClass}`}
      >
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold tracking-wide">{error.title}</p>
            <p className="mt-1 text-sm text-neutral-200">{error.message}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Dismiss error"
            className="rounded-md px-2 py-1 text-neutral-300 hover:bg-white/10 hover:text-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
