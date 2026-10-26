export const LOCALES = ["en", "es"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "es";

// Set when someone picks a language, so it wins over location next time.
export const LOCALE_COOKIE = "walkers-lang";

export function isLocale(v: unknown): v is Locale {
  return typeof v === "string" && (LOCALES as readonly string[]).includes(v);
}

// Countries where Spanish is the main language (ISO 3166-1 alpha-2).
const SPANISH_SPEAKING = new Set([
  "ES", "MX", "AR", "CO", "CL", "PE", "VE", "EC", "GT", "CU", "BO", "DO",
  "HN", "PY", "SV", "NI", "CR", "PA", "UY", "PR", "GQ",
]);

// Highest-weighted supported language from an Accept-Language header.
function fromAcceptLanguage(header: string | null | undefined): Locale | null {
  if (!header) return null;
  const ranked = header
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.find((p) => p.trim().startsWith("q="));
      return { lang: tag.trim().slice(0, 2).toLowerCase(), q: q ? Number(q.trim().slice(2)) || 0 : 1 };
    })
    .sort((a, b) => b.q - a.q);
  const match = ranked.find((r) => isLocale(r.lang));
  return match ? (match.lang as Locale) : null;
}

// Order: an explicit choice, then the visitor's country, then their browser.
export function pickLocale({
  cookie,
  country,
  acceptLanguage,
}: {
  cookie?: string | null;
  country?: string | null;
  acceptLanguage?: string | null;
}): Locale {
  if (isLocale(cookie)) return cookie;
  if (country && SPANISH_SPEAKING.has(country.toUpperCase())) return "es";
  return fromAcceptLanguage(acceptLanguage) ?? DEFAULT_LOCALE;
}
