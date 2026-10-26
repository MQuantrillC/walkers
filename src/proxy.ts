import { NextResponse, type NextRequest } from "next/server";
import { LOCALES, LOCALE_COOKIE, pickLocale } from "@/i18n/config";

// Sends visitors without a language in the URL to /en/... or /es/...,
// choosing by their saved choice, then their country (Vercel's geo header),
// then their browser's languages.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (LOCALES.some((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`))) return;

  const locale = pickLocale({
    cookie: request.cookies.get(LOCALE_COOKIE)?.value,
    country: request.headers.get("x-vercel-ip-country"),
    acceptLanguage: request.headers.get("accept-language"),
  });
  request.nextUrl.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(request.nextUrl);
}

export const config = {
  // Skip Next.js internals, API routes and files with an extension.
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};
