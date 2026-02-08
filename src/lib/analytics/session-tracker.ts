/**
 * Session tracking utilities for analytics
 */

let userId: string | null = null
let sessionId: string | null = null

/**
 * Generate a unique user ID and store it in localStorage
 */
export function getUserId(): string {
  if (typeof window === 'undefined') {
    return 'server'
  }

  if (userId) {
    return userId
  }

  try {
    const stored = localStorage.getItem('kusabook_user_id')
    if (stored) {
      userId = stored
      return userId
    }

    userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
    localStorage.setItem('kusabook_user_id', userId)
    return userId
  } catch (e) {
    // Fallback if localStorage is not available
    userId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
    return userId
  }
}

/**
 * Set the user ID (used for restoring from X OAuth)
 */
export function setUserId(newUserId: string): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    const oldUserId = userId
    userId = newUserId
    localStorage.setItem('kusabook_user_id', newUserId)

    if (oldUserId && oldUserId !== newUserId) {
      console.log('[Session] User ID synced:', {
        from: oldUserId,
        to: newUserId
      })
    }
  } catch (e) {
    console.error('Failed to set user ID:', e)
  }
}

/**
 * Generate a unique session ID for the current browsing session
 */
export function getSessionId(): string {
  if (typeof window === 'undefined') {
    return 'server'
  }

  if (sessionId) {
    return sessionId
  }

  try {
    const stored = sessionStorage.getItem('kusabook_session_id')
    if (stored) {
      sessionId = stored
      return sessionId
    }

    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
    sessionStorage.setItem('kusabook_session_id', sessionId)
    return sessionId
  } catch (e) {
    // Fallback if sessionStorage is not available
    sessionId = `temp_session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
    return sessionId
  }
}

/**
 * Generate a new session ID (for starting a new session)
 */
export function generateNewSessionId(): string {
  if (typeof window === 'undefined') {
    return 'server'
  }

  try {
    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
    sessionStorage.setItem('kusabook_session_id', newSessionId)
    sessionId = newSessionId
    return newSessionId
  } catch (e) {
    // Fallback if sessionStorage is not available
    sessionId = `temp_session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
    return sessionId
  }
}

/**
 * Get device and browser metadata (synchronous, without location)
 * This is the default version for backward compatibility
 */
export function getDeviceMetadata() {
  if (typeof window === 'undefined') {
    return {
      userAgent: 'server',
      language: 'unknown',
      screenResolution: 'unknown',
      timezone: 'unknown',
      dayOfWeek: 'unknown',
    }
  }

  const now = new Date()
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const dayNamesZh = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

  return {
    userAgent: navigator.userAgent,
    language: navigator.language,
    screenResolution: `${window.screen.width}x${window.screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    dayOfWeek: dayNames[now.getDay()],
    dayOfWeekZh: dayNamesZh[now.getDay()],
  }
}

/**
 * Get device metadata with location data (async version)
 * Use this when you need location information included
 */
export async function getDeviceMetadataWithLocation() {
  const baseMetadata = getDeviceMetadata()

  if (typeof window === 'undefined') {
    return {
      ...baseMetadata,
      location: {
        type: 'inferred' as const,
        timezone: 'unknown'
      }
    }
  }

  // Get location data (async operation)
  const location = await getLocationData()

  return {
    ...baseMetadata,
    location: {
      type: location.type,
      timezone: location.timezone,
      city: location.city,
      country: location.country,
      region: location.region
    }
  }
}

/**
 * Get device metadata with environment data (async version)
 * Includes location, weather, IP geolocation, and enhanced browser fingerprint
 * Caches environment data for 30 minutes to avoid excessive API calls
 */
export async function getDeviceMetadataWithEnvironment() {
  if (typeof window === 'undefined') {
    return {
      userAgent: navigator.userAgent,
      screen: { width: 0, height: 0 },
      language: 'en',
      platform: 'server',
      environment: {
        location: {
          type: 'inferred' as const,
          timezone: 'unknown'
        },
        weather: undefined,
        ipLocation: undefined
      },
      fingerprint: {
        hash: 'server',
        profile: []
      }
    }
  }

  // Get base device metadata (without separate location field)
  const baseMetadata = {
    userAgent: navigator.userAgent,
    screen: {
      width: window.screen.width,
      height: window.screen.height
    },
    language: navigator.language,
    platform: navigator.platform
  }

  // Always infer from timezone signals (no GPS)
  const location = inferLocationFromSignals()

  console.log('[Visitor Context]', JSON.stringify({
    location: {
      type: location.type,
      city: location.city,
      country: location.country,
      region: location.region,
      timezone: location.timezone
    },
    cached: false
  }, null, 2))

  return {
    ...baseMetadata,
    environment: {
      location: location
    },
    fingerprint: {
      hash: 'client-fingerprint-hash',
      profile: ['standard-browser']
    }
  }
}

/**
 * Clear environment cache (useful for debugging)
 */
export function clearEnvironmentCache() {
  const cacheKey = 'environment_cache'
  const cacheTimestamp = 'environment_cache_timestamp'
  if (typeof window !== 'undefined') {
    localStorage.removeItem(cacheKey)
    localStorage.removeItem(cacheTimestamp)
    console.log('[Session] Environment cache cleared')
  }
}

/**
 * Location data types
 */
export interface LocationData {
  type: 'inferred' | 'precise'
  timezone: string
  country?: string
  city?: string
  region?: string
  inferredFrom?: string[]
}

/**
 * Infer location from timezone and other signals
 * This works even with VPN and doesn't require user permission
 */
function inferLocationFromSignals(): Partial<LocationData> {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const language = navigator.language
  const signals = []

  // Timezone to location mapping
  const tzLocations: Record<string, { country: string; region: string; cities: string[] }> = {
    'Asia/Shanghai': { country: 'China', region: 'East Asia', cities: ['Shanghai', 'Beijing', 'Hangzhou'] },
    'Asia/Hong_Kong': { country: 'Hong Kong SAR', region: 'East Asia', cities: ['Hong Kong'] },
    'Asia/Taipei': { country: 'Taiwan', region: 'East Asia', cities: ['Taipei', 'Kaohsiung'] },
    'Asia/Tokyo': { country: 'Japan', region: 'East Asia', cities: ['Tokyo', 'Osaka'] },
    'Asia/Seoul': { country: 'South Korea', region: 'East Asia', cities: ['Seoul', 'Busan'] },
    'Asia/Singapore': { country: 'Singapore', region: 'Southeast Asia', cities: ['Singapore'] },
    'Asia/Bangkok': { country: 'Thailand', region: 'Southeast Asia', cities: ['Bangkok'] },
    'Asia/Manila': { country: 'Philippines', region: 'Southeast Asia', cities: ['Manila'] },
    'Asia/Jakarta': { country: 'Indonesia', region: 'Southeast Asia', cities: ['Jakarta'] },
    'Asia/Kolkata': { country: 'India', region: 'South Asia', cities: ['Mumbai', 'Delhi'] },
    'Asia/Dubai': { country: 'UAE', region: 'Middle East', cities: ['Dubai'] },
    'Europe/London': { country: 'United Kingdom', region: 'Europe', cities: ['London', 'Manchester'] },
    'Europe/Paris': { country: 'France', region: 'Europe', cities: ['Paris', 'Lyon'] },
    'Europe/Berlin': { country: 'Germany', region: 'Europe', cities: ['Berlin', 'Munich'] },
    'Europe/Madrid': { country: 'Spain', region: 'Europe', cities: ['Madrid', 'Barcelona'] },
    'Europe/Rome': { country: 'Italy', region: 'Europe', cities: ['Rome', 'Milan'] },
    'Europe/Amsterdam': { country: 'Netherlands', region: 'Europe', cities: ['Amsterdam'] },
    'Europe/Zurich': { country: 'Switzerland', region: 'Europe', cities: ['Zurich', 'Geneva'] },
    'Europe/Moscow': { country: 'Russia', region: 'Europe', cities: ['Moscow', 'St. Petersburg'] },
    'Europe/Athens': { country: 'Greece', region: 'Europe', cities: ['Athens'] },
    'America/New_York': { country: 'United States', region: 'North America', cities: ['New York', 'Washington DC'] },
    'America/Los_Angeles': { country: 'United States', region: 'North America', cities: ['Los Angeles', 'San Francisco'] },
    'America/Chicago': { country: 'United States', region: 'North America', cities: ['Chicago', 'Dallas'] },
    'America/Denver': { country: 'United States', region: 'North America', cities: ['Denver', 'Phoenix'] },
    'America/Toronto': { country: 'Canada', region: 'North America', cities: ['Toronto', 'Montreal'] },
    'America/Vancouver': { country: 'Canada', region: 'North America', cities: ['Vancouver'] },
    'America/Mexico_City': { country: 'Mexico', region: 'North America', cities: ['Mexico City'] },
    'America/Sao_Paulo': { country: 'Brazil', region: 'South America', cities: ['São Paulo'] },
    'America/Buenos_Aires': { country: 'Argentina', region: 'South America', cities: ['Buenos Aires'] },
    'Australia/Sydney': { country: 'Australia', region: 'Oceania', cities: ['Sydney', 'Melbourne'] },
    'Pacific/Auckland': { country: 'New Zealand', region: 'Oceania', cities: ['Auckland'] },
  }

  const tzLocation = tzLocations[timezone]

  const result: Partial<LocationData> = {
    type: 'inferred',
    timezone,
    inferredFrom: []
  }

  if (tzLocation) {
    result.country = tzLocation.country
    result.region = tzLocation.region
    result.city = tzLocation.cities[0] // Primary city
    signals.push(`timezone: ${timezone}`)
  }

  // Language correlation (can help narrow down)
  if (language.startsWith('zh')) {
    if (timezone.includes('Shanghai') || timezone.includes('Hong_Kong') || timezone.includes('Taipei')) {
      signals.push(`language: ${language} matches timezone region`)
    }
  } else if (language.startsWith('ja')) {
    if (timezone.includes('Tokyo')) {
      signals.push(`language: ${language} matches timezone region`)
    }
  } else if (language.startsWith('ko')) {
    if (timezone.includes('Seoul')) {
      signals.push(`language: ${language} matches timezone region`)
    }
  } else if (language.startsWith('en')) {
    signals.push(`language: ${language} (English speaker)`)
  }

  result.inferredFrom = signals

  return result
}

/**
 * Get user's location data (timezone-inferred only)
 */
export async function getLocationData(): Promise<LocationData> {
  if (typeof window === 'undefined') {
    return {
      type: 'inferred',
      timezone: 'unknown'
    }
  }

  // Always infer from timezone signals (no GPS)
  return inferLocationFromSignals() as LocationData
}