/**
 * Data transformation utilities
 * Convert 3rd party API responses into Axori's standardized schema
 */

import type { PropertyDetails } from "./rentcast";
import type { MapboxAddressSuggestion } from "./mapbox";

/**
 * Transform Rentcast property data into Axori property schema
 * This extracts and normalizes data from Rentcast's response
 */
export function transformRentcastToAxori(
  rentcastData: PropertyDetails
): {
  // Property details that can update the property record
  propertyData: {
    bedrooms?: number;
    bathrooms?: number;
    squareFootage?: number;
    lotSize?: number;
    yearBuilt?: number;
    propertyType?: string;
  };
  // Additional metadata (can be stored separately if needed)
  metadata: {
    assessorID?: string;
    legalDescription?: string;
    subdivision?: string;
    zoning?: string;
    lastSaleDate?: string;
    lastSalePrice?: number;
    hoaFee?: number;
    county?: string;
    taxAssessments?: Record<string, any>;
    propertyTaxes?: Record<string, any>;
    history?: Record<string, any>;
    owner?: any;
  };
} {
  return {
    propertyData: {
      bedrooms: rentcastData.bedrooms,
      bathrooms: rentcastData.bathrooms,
      squareFootage: rentcastData.squareFootage,
      lotSize: rentcastData.lotSize,
      yearBuilt: rentcastData.yearBuilt,
      propertyType: rentcastData.propertyType,
    },
    metadata: {
      assessorID: rentcastData.assessorID,
      legalDescription: rentcastData.legalDescription,
      subdivision: rentcastData.subdivision,
      zoning: rentcastData.zoning,
      lastSaleDate: rentcastData.lastSaleDate,
      lastSalePrice: rentcastData.lastSalePrice,
      hoaFee: rentcastData.hoa?.fee || undefined,
      county: rentcastData.county,
      taxAssessments: rentcastData.taxAssessments,
      propertyTaxes: rentcastData.propertyTaxes,
      history: rentcastData.history,
      owner: rentcastData.owner,
    },
  };
}

/**
 * Transform Mapbox address suggestion into Axori property address format
 * This is used when a user selects an address from Mapbox autocomplete
 */
export function transformMapboxToAxoriAddress(
  mapboxSuggestion: MapboxAddressSuggestion
): {
  address: string;
  city: string;
  state: string;
  zipCode: string; // Use zipCode from suggestion (matches database schema)
  latitude: number;
  longitude: number;
  mapboxPlaceId: string;
  fullAddress: string;
} {
  return {
    address: mapboxSuggestion.streetAddress,
    city: mapboxSuggestion.city,
    state: mapboxSuggestion.state,
    zipCode: mapboxSuggestion.zipCode,
    latitude: mapboxSuggestion.latitude,
    longitude: mapboxSuggestion.longitude,
    mapboxPlaceId: mapboxSuggestion.placeId,
    fullAddress: mapboxSuggestion.placeName,
  };
}

