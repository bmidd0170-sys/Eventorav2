import { NextResponse } from "next/server"

type ErrorExtras = Record<string, unknown>

function errorResponse(status: number, message: string, extras?: ErrorExtras) {
  return NextResponse.json({ error: message, ...(extras ?? {}) }, { status })
}

export function badRequest(message = "Bad request", extras?: ErrorExtras) {
  return errorResponse(400, message, extras)
}

export function unauthorized(message = "Unauthorized", extras?: ErrorExtras) {
  return errorResponse(401, message, extras)
}

export function forbidden(message = "Forbidden", extras?: ErrorExtras) {
  return errorResponse(403, message, extras)
}

export function notFound(message = "Not found", extras?: ErrorExtras) {
  return errorResponse(404, message, extras)
}

export function conflict(message: string, extras?: ErrorExtras) {
  return errorResponse(409, message, extras)
}

export function internalServerError(message = "Internal server error", extras?: ErrorExtras) {
  return errorResponse(500, message, extras)
}
