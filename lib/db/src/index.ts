import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema/index";
import { createQueryEngine } from "./queryEngine";
import { resetDatabase, loadDatabase, saveDatabase } from "./storage";

const { Pool } = pg;

let pool: any = null;
let db: any = null;

const dbUrl = process.env.DATABASE_URL;
// Only attempt real postgres if URL is valid and not the unreachable Replit "helium" host
const isUsableDbUrl = Boolean(dbUrl && !dbUrl.includes("helium") && !dbUrl.includes("localhost"));

if (isUsableDbUrl) {
  try {
    pool = new Pool({ connectionString: dbUrl });
    db = drizzle(pool, { schema });
    console.info("[AI Studio Database] Connected to PostgreSQL via DATABASE_URL");
  } catch (err) {
    console.warn("[AI Studio Database] Error initializing PostgreSQL pool, falling back to persistent dev store", err);
  }
}

if (!db) {
  console.info("[AI Studio Database] Operating with comprehensive persistent development database");
  db = createQueryEngine();
}

export { pool, db, resetDatabase, loadDatabase, saveDatabase };
export * from "./schema/index";
