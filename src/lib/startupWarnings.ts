/**
 * Logs non-fatal warnings at startup if production-like environment variables
 * are still using placeholder values. This helps prevent deploying with
 * dummy API keys or missing seed credentials.
 */
export function logStartupWarnings() {
  const isProd = process.env.NODE_ENV === 'production'
  if (!isProd) return

  const placeholderKeys = [
    'YOUR_GOOGLE_MAPS_API_KEY',
    'YOUR_GOOGLE_PLACES_KEY'
  ]

  const googleMaps = process.env.GOOGLE_MAPS_API_KEY || ''
  const googlePlaces = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY || ''

  if (placeholderKeys.includes(googleMaps)) {
    console.warn('[startup] ⚠ GOOGLE_MAPS_API_KEY is a placeholder value; set a real key via secrets.')
  }
  if (placeholderKeys.includes(googlePlaces)) {
    console.warn('[startup] ⚠ NEXT_PUBLIC_GOOGLE_PLACES_API_KEY is a placeholder value; set a real key via secrets.')
  }

  // Seed warnings (non-blocking)
  const adminEmail = process.env.SEED_ADMIN_EMAIL
  const adminPass = process.env.SEED_ADMIN_PASSWORD
  if (!adminEmail || !adminPass) {
    console.info('[startup] ℹ Seed admin credentials not fully set (SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD) — seeding will skip admin creation.')
  }
}

// Auto-run in server context (avoids running inside browser bundle)
if (typeof window === 'undefined') {
  try { logStartupWarnings() } catch { /* noop */ }
}
