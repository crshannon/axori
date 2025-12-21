// AI agent integrations via Tavily and Perplexity

export class TavilyClient {
  private apiKey: string;
  private baseUrl = "https://api.tavily.com";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async search(query: string) {
    const response = await fetch(`${this.baseUrl}/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: this.apiKey,
        query,
        search_depth: "basic",
      }),
    });

    if (!response.ok) {
      throw new Error(`Tavily API error: ${response.statusText}`);
    }

    return response.json();
  }
}

export class PerplexityClient {
  private apiKey: string;
  private baseUrl = "https://api.perplexity.ai";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async chat(messages: Array<{ role: string; content: string }>) {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-sonar-large-128k-online",
        messages,
      }),
    });

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.statusText}`);
    }

    return response.json();
  }
}


