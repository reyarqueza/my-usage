import { auth } from "@/auth"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

/**
 * With lazy `NextAuth(() => { ... })`, the exported `auth` is `async`, so
 * `auth((req) => …)` returns a **Promise** of the middleware handler — not the
 * handler itself. Await that promise once and reuse the resolved function.
 */
const authenticatePromise = auth((req) => {
  if (!req.auth && req.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", req.nextUrl))
  }
})

/** Next.js validates Proxy as `export default function`. */
export default async function proxy(
  request: NextRequest,
  context?: unknown,
) {
  const authenticate = await authenticatePromise
  if (typeof authenticate !== "function") {
    throw new TypeError(
      "next-auth middleware handler failed to initialize; ensure auth.ts exports lazy NextAuth correctly.",
    )
  }
  return authenticate(
    request,
    context as Parameters<typeof authenticate>[1],
  )
}

export const config = {
  matcher: ["/dashboard/:path*"],
}
