import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Load environment variables from root .env.local or .env
config({ path: [".env.local", ".env", "../.env.local", "../../.env.local"] });

export default defineConfig({
  schema: "./src/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "",
  },
});


