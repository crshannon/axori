import { Hono } from "hono";
import { MapboxClient, parseMapboxFeature } from "@axori/shared/src/integrations/mapbox";

const mapboxRouter = new Hono();

/**
 * Search addresses via Mapbox Geocoding API
 * GET /api/mapbox/search?query=...
 *
 * This endpoint proxies Mapbox requests server-side to keep API keys secure.
 */
mapboxRouter.get("/search", async (c) => {
  const query = c.req.query("query");
  // Use VITE_MAPBOX_ACCESS_TOKEN from root .env.local (for local development)
  const apiKey = process.env.VITE_MAPBOX_ACCESS_TOKEN || process.env.MAPBOX_ACCESS_TOKEN;

  if (!apiKey) {
    console.error("Mapbox API key not found. Checked VITE_MAPBOX_ACCESS_TOKEN and MAPBOX_ACCESS_TOKEN");
    console.error("Available env vars:", Object.keys(process.env).filter(k => k.includes('MAPBOX')));
    return c.json({ error: "Mapbox API key not configured" }, 500);
  }

  // Log token prefix for debugging (don't log full token for security)
  console.log(`Using Mapbox token: ${apiKey.substring(0, 10)}... (${apiKey.startsWith('pk.') ? 'public' : 'secret'} token)`);

  if (!query || query.length < 3) {
    return c.json({ suggestions: [] });
  }

  try {
    const mapboxClient = new MapboxClient(apiKey);
    const data = await mapboxClient.searchAddresses(query, {
      limit: 5,
      types: ["address"],
      country: "us",
    });

    // Parse features into our standardized format
    const suggestions = data.features.map(parseMapboxFeature);

    // Return both parsed suggestions and raw features (for storing when address is selected)
    return c.json({
      suggestions,
      rawFeatures: data.features, // Keep raw features for storage
    });
  } catch (error: any) {
    console.error("Error fetching Mapbox data:", error);
    console.error("Error details:", error.message, error.stack);
    return c.json(
      { error: "Failed to fetch address suggestions", details: error.message },
      500
    );
  }
});

export default mapboxRouter;

