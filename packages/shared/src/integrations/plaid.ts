// Plaid API integration utilities

export class PlaidClient {
  private clientId: string;
  private secret: string;
  private environment: "sandbox" | "development" | "production";
  private baseUrl: string;

  constructor(
    clientId: string,
    secret: string,
    environment: "sandbox" | "development" | "production" = "sandbox"
  ) {
    this.clientId = clientId;
    this.secret = secret;
    this.environment = environment;
    this.baseUrl =
      environment === "production"
        ? "https://production.plaid.com"
        : environment === "development"
        ? "https://development.plaid.com"
        : "https://sandbox.plaid.com";
  }

  private async request<T>(endpoint: string, body: Record<string, unknown>): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: this.clientId,
        secret: this.secret,
        ...body,
      }),
    });

    if (!response.ok) {
      throw new Error(`Plaid API error: ${response.statusText}`);
    }

    return response.json();
  }

  async createLinkToken(userId: string) {
    return this.request("/link/token/create", {
      user: { client_user_id: userId },
      client_name: "Axori",
      products: ["transactions"],
      country_codes: ["US"],
      language: "en",
    });
  }

  async exchangePublicToken(publicToken: string) {
    return this.request("/item/public_token/exchange", {
      public_token: publicToken,
    });
  }
}


