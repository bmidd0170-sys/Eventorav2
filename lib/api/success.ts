import { NextResponse } from "next/server"

type SuccessBody = Record<string, unknown>

export function ok(body: SuccessBody = {}, status = 200) {
  if (Object.prototype.hasOwnProperty.call(body, "ok")) {
    return NextResponse.json(body, { status })
  }

  return NextResponse.json({ ok: true, ...body }, { status })
}

export function created(body: SuccessBody = {}) {
  return ok(body, 201)
}
