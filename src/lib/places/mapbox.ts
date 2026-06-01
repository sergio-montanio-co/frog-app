import { env } from '@/lib/env'

const API_BASE = 'https://api.mapbox.com/search/searchbox/v1'

export type PlacePrediction = {
  mapboxId: string
  name: string
  placeFormatted: string
  fullAddress: string | null
  featureType: string
  poiCategory: string[]
}

export type PlaceDetails = {
  mapboxId: string
  name: string
  formattedAddress: string
  city: string | null
  countryIso2: string | null
  coordinates: { lat: number; lng: number } | null
}

type SuggestResponse = {
  suggestions?: Array<{
    mapbox_id: string
    name: string
    name_preferred?: string
    place_formatted: string
    full_address?: string
    feature_type: string
    poi_category?: string[]
  }>
}

type RetrieveResponse = {
  features?: Array<{
    properties: {
      name: string
      name_preferred?: string
      full_address?: string
      place_formatted: string
      context?: {
        country?: { name?: string; country_code?: string }
        region?: { name?: string }
        place?: { name?: string }
        locality?: { name?: string }
      }
      coordinates?: { latitude: number; longitude: number }
    }
    geometry?: { coordinates?: [number, number] }
  }>
}

export function isPlacesEnabled(): boolean {
  return Boolean(env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN)
}

export async function searchPlaces(
  input: string,
  sessionToken: string,
  opts: {
    signal?: AbortSignal
    languageCode?: string
    country?: string
  } = {},
): Promise<PlacePrediction[]> {
  const token = env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN
  if (!token) return []
  if (input.trim().length < 3) return []

  const params = new URLSearchParams({
    q: input,
    session_token: sessionToken,
    language: opts.languageCode ?? 'es',
    access_token: token,
    types: 'poi,place,address',
    limit: '6',
  })
  if (opts.country) params.set('country', opts.country)

  const res = await fetch(`${API_BASE}/suggest?${params.toString()}`, {
    signal: opts.signal,
  })
  if (!res.ok) throw new Error(`Mapbox suggest ${res.status}`)
  const json = (await res.json()) as SuggestResponse

  return (json.suggestions ?? []).map((s) => ({
    mapboxId: s.mapbox_id,
    name: s.name_preferred ?? s.name,
    placeFormatted: s.place_formatted,
    fullAddress: s.full_address ?? null,
    featureType: s.feature_type,
    poiCategory: s.poi_category ?? [],
  }))
}

export async function getPlaceDetails(
  mapboxId: string,
  sessionToken: string,
  opts: { languageCode?: string } = {},
): Promise<PlaceDetails> {
  const token = env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN
  if (!token) throw new Error('Mapbox access token missing')

  const params = new URLSearchParams({
    session_token: sessionToken,
    language: opts.languageCode ?? 'es',
    access_token: token,
  })

  const res = await fetch(
    `${API_BASE}/retrieve/${encodeURIComponent(mapboxId)}?${params.toString()}`,
  )
  if (!res.ok) throw new Error(`Mapbox retrieve ${res.status}`)
  const json = (await res.json()) as RetrieveResponse

  const feature = json.features?.[0]
  if (!feature) throw new Error('Mapbox retrieve: no features')

  const p = feature.properties
  const city = p.context?.place?.name ?? p.context?.locality?.name ?? null
  const countryIso2 = p.context?.country?.country_code?.toUpperCase() ?? null

  const coords =
    p.coordinates ??
    (feature.geometry?.coordinates
      ? {
          longitude: feature.geometry.coordinates[0],
          latitude: feature.geometry.coordinates[1],
        }
      : null)

  return {
    mapboxId,
    name: p.name_preferred ?? p.name,
    formattedAddress: p.full_address ?? p.place_formatted,
    city,
    countryIso2,
    coordinates: coords
      ? { lat: coords.latitude, lng: coords.longitude }
      : null,
  }
}

export function newSessionToken(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}
