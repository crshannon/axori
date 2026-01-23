// ATTOM Data API integration utilities

export class AttomClient {
  private apiKey: string;
  private baseUrl = "https://api.gateway.attomdata.com";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        apikey: this.apiKey,
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`ATTOM API error: ${response.statusText}`);
    }

    return response.json();
  }

  async getPropertyDetails(_address: string, _city: string, _state: string, _zipCode: string) {
    return this.request("/propertyapi/v1.0.0/property/detail", {
      method: "GET",
      // Add query parameters as needed
    });
  }
}


