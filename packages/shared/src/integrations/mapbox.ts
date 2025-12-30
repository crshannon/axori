/**
 * Mapbox Geocoding API types and utilities
 *
 * These types match the Mapbox Geocoding API response structure.
 * See: https://docs.mapbox.com/api/search/geocoding/
 */

/**
 * Mapbox Geocoding API feature context item
 * Context provides additional information about the feature's location hierarchy
 */
export interface MapboxContext {
  /** Mapbox context ID (e.g., "postcode.12345", "place.67890", "region.11111") */
  id: string
  /** Display text for the context item */
  text: string
  /** Short code (e.g., "US-TX" for Texas) */
  short_code?: string
  /** Wikidata identifier */
  wikidata?: string
}

/**
 * Mapbox Geocoding API feature properties
 */
export interface MapboxFeatureProperties {
  /** Accuracy indicator (e.g., "street", "point") */
  accuracy?: string
  /** Full street address (if available) */
  address?: string
  /** Mapbox category */
  category?: string
  /** Maki icon name */
  maki?: string
  /** Wikidata identifier */
  wikidata?: string
}

/**
 * Mapbox Geocoding API feature
 * Represents a single address/location suggestion from Mapbox
 */
export interface MapboxFeature {
  /** Feature ID (Mapbox place ID) */
  id: string
  /** Feature type */
  type: string
  /** Array of place types (e.g., ["address"]) */
  place_type: Array<string>
  /** Relevance score (0-1, higher is more relevant) */
  relevance: number
  /** Feature properties */
  properties: MapboxFeatureProperties
  /** Display text for the feature */
  text: string
  /** Full place name (formatted address) */
  place_name: string
  /** Coordinates as [longitude, latitude] */
  center: [number, number]
  /** Context array for location hierarchy */
  context?: Array<MapboxContext>
  /** Geometry type */
  geometry?: {
    type: string
    coordinates: [number, number]
  }
  /** Bounding box as [minLng, minLat, maxLng, maxLat] */
  bbox?: [number, number, number, number]
}

/**
 * Mapbox Geocoding API response
 */
export interface MapboxGeocodingResponse {
  /** Response type */
  type: string
  /** Query terms used */
  query: Array<string>
  /** Array of matching features */
  features: Array<MapboxFeature>
  /** Attribution text */
  attribution?: string
}

/**
 * Parsed address suggestion from Mapbox
 * This structure aligns with our database schema
 */
export interface MapboxAddressSuggestion {
  /** Full formatted address (e.g., "123 Main St, Austin, TX 78704") */
  fullAddress: string
  /** Street address (e.g., "123 Main St") */
  address: string
  /** City name */
  city: string
  /** 2-letter state code (e.g., "TX") */
  state: string
  /** ZIP code (5 or 9 digits) */
  zip: string
  /** Full place name from Mapbox */
  placeName: string
  /** Latitude coordinate */
  latitude: number | null
  /** Longitude coordinate */
  longitude: number | null
  /** Mapbox place ID */
  mapboxPlaceId: string
  /** Relevance score (0-1) */
  relevance: number
}

/**
 * Parse Mapbox Geocoding API response into structured address data
 *
 * @param feature - Mapbox feature from geocoding response
 * @returns Parsed address suggestion aligned with database schema
 */
export function parseMapboxFeature(
  feature: MapboxFeature,
): MapboxAddressSuggestion {
  const context = feature.context || []

  // Extract address components from context array
  // Mapbox context IDs are like "place.12345", "region.12345", "postcode.12345"
  const postcodeContext = context.find((c) => c.id.startsWith('postcode'))
  const placeContext = context.find((c) => c.id.startsWith('place'))
  const regionContext = context.find((c) => c.id.startsWith('region'))

  const zip = postcodeContext?.text || ''
  const city = placeContext?.text || ''
  // Use short_code (e.g., "US-TX") or fallback to full region name
  const state =
    regionContext?.short_code?.split('-').pop()?.toUpperCase() ||
    regionContext?.text ||
    ''

  // Parse the street address
  // For address features, Mapbox structure varies:
  // - feature.text can be the house number OR the full address line
  // - feature.properties.address might be the street name OR might not exist
  // - feature.place_name always has the complete formatted address (e.g., "123 Main St, Austin, TX 78704")
  //
  // Most reliable approach: parse from place_name first part (before first comma)
  // This always includes the full street address with number
  let streetAddress = ''

  // Priority 1: Parse from place_name first part (most reliable - always has full address with number)
  // place_name format: "123 Main St, Austin, TX 78704"
  if (feature.place_name && feature.place_name.includes(',')) {
    const placeParts = feature.place_name.split(',')
    const firstPart = placeParts[0]?.trim()
    if (firstPart && firstPart.length > 0) {
      streetAddress = firstPart
    }
  }

  // Priority 2: If place_name parsing didn't work, try combining feature.text + feature.properties.address
  // This handles cases where Mapbox provides number and street separately
  if (!streetAddress && feature.properties.address && feature.text) {
    // Combine number and street name
    streetAddress = `${feature.text} ${feature.properties.address}`.trim()
  }

  // Priority 3: Fallback to feature.properties.address if it exists (might be full address)
  if (!streetAddress && feature.properties.address) {
    streetAddress = feature.properties.address.trim()
  }

  // Priority 4: Fallback to feature.text (might be full address or just number)
  if (!streetAddress && feature.text) {
    streetAddress = feature.text.trim()
  }

  // Priority 5: Last resort - use place_name if split didn't work
  if (!streetAddress && feature.place_name) {
    streetAddress = feature.place_name.trim()
  }

  const fullPlaceName = feature.place_name

  // Extract coordinates (Mapbox returns [longitude, latitude])
  const [longitude, latitude] = feature.center

  return {
    fullAddress: fullPlaceName,
    address: streetAddress,
    city: city,
    state: state,
    zip: zip,
    placeName: fullPlaceName,
    latitude: latitude,
    longitude: longitude,
    mapboxPlaceId: feature.id,
    relevance: feature.relevance,
  }
}

/**
 * Convert MapboxAddressSuggestion to database insert format
 *
 * @param suggestion - Parsed Mapbox address suggestion
 * @param portfolioId - Portfolio ID (from portfolio context)
 * @param addedBy - User ID who added the property (from auth context)
 * @param propertyType - Property type (from form)
 * @returns Data ready for database insert
 */
export function mapboxSuggestionToPropertyInsert(
  suggestion: MapboxAddressSuggestion,
  portfolioId: string,
  addedBy: string,
  propertyType: string,
) {
  return {
    portfolioId,
    addedBy,
    address: suggestion.address,
    city: suggestion.city,
    state: suggestion.state,
    zipCode: suggestion.zip,
    latitude: suggestion.latitude?.toString() || null,
    longitude: suggestion.longitude?.toString() || null,
    mapboxPlaceId: suggestion.mapboxPlaceId,
    fullAddress: suggestion.fullAddress,
    propertyType,
  }
}

