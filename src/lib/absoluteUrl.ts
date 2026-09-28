import type { NextRequest } from "next/server";

// On Amplify's SSR compute, request.url's host can reflect the internal
// address the Next.js process is bound to (e.g. localhost:3000) rather than
// the public domain, so redirects built from it can leave the site entirely.
// x-forwarded-host/-proto are set by CloudFront to the real values.
export function absoluteUrl(path: string, request: NextRequest): URL {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost ?? request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") ?? "https";

  if (!host) {
    return new URL(path, request.url);
  }

  return new URL(path, `${proto}://${host}`);
}
