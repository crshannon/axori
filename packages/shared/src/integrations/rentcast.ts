// Rentcast API integration utilities

export class RentcastClient {
  private apiKey: string;
  private baseUrl = "https://api.rentcast.io/v1";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        "X-Api-Key": this.apiKey,
        accept: "application/json",
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Rentcast API error: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get property details from Rentcast API
   * @param address - Street address (e.g., "5500 Grand Lake Dr")
   * @param city - City name (e.g., "San Antonio")
   * @param state - 2-letter state code (e.g., "TX")
   * @param zipCode - ZIP code (e.g., "78244")
   */
  async getPropertyDetails(address: string, city: string, state: string, zipCode: string) {
    // Rentcast API expects a single 'address' parameter in format: "Street, City, State, Zip"
    const fullAddress = `${address.trim()}, ${city.trim()}, ${state.trim()}, ${zipCode.trim()}`;

    const params = new URLSearchParams({
      address: fullAddress,
    });

    return this.request<PropertyDetails>(`/properties?${params.toString()}`, {
      method: "GET",
      headers: {
        accept: "application/json",
      },
    });
  }
}

/**
 * Rentcast API property details response type
 * Based on the example response provided
 */
export interface PropertyDetails {
  id: string;
  formattedAddress: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  stateFips: string;
  zipCode: string;
  county: string;
  countyFips: string;
  latitude: number;
  longitude: number;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  squareFootage: number;
  lotSize: number;
  yearBuilt: number;
  assessorID: string;
  legalDescription: string;
  subdivision: string;
  zoning: string;
  lastSaleDate: string;
  lastSalePrice: number;
  hoa: {
    fee: number;
  } | null;
  features: {
    architectureType?: string;
    cooling?: boolean;
    coolingType?: string;
    exteriorType?: string;
    fireplace?: boolean;
    fireplaceType?: string;
    floorCount?: number;
    foundationType?: string;
    garage?: boolean;
    garageSpaces?: number;
    garageType?: string;
    heating?: boolean;
    heatingType?: string;
    pool?: boolean;
    poolType?: string;
    roofType?: string;
    roomCount?: number;
    unitCount?: number;
    viewType?: string;
  };
  taxAssessments: Record<string, {
    year: number;
    value: number;
    land: number;
    improvements: number;
  }>;
  propertyTaxes: Record<string, {
    year: number;
    total: number;
  }>;
  history: Record<string, {
    event: string;
    date: string;
    price: number;
  }>;
  owner: {
    names: string[];
    type: string;
    mailingAddress: {
      id: string;
      formattedAddress: string;
      addressLine1: string;
      addressLine2: string | null;
      city: string;
      state: string;
      stateFips: string;
      zipCode: string;
    };
  } | null;
  ownerOccupied: boolean | null;
}


