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
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Rentcast API error: ${response.statusText}`);
    }

    return response.json();
  }

  async getPropertyDetails(address: string, city: string, state: string, zipCode: string) {
    return this.request("/properties", {
      method: "GET",
      // Add query parameters as needed
    });
  }
}


