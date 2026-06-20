import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined");
}

// Connection pooling for high-scale scenarios
const sql = neon(process.env.DATABASE_URL, {
  fetchOptions: {
    cache: "no-store",
  },
});

export const db = drizzle(sql, { schema });

// Export schema for type inference
export type DB = typeof db;
export { schema };
