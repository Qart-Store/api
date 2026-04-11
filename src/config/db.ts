import { readFileSync } from "node:fs";
import "./env.js";
import { Pool, QueryResult, QueryResultRow } from "pg";
import { resolve } from "node:path";
import { cwd } from "node:process";

const databaseUrl = process.env.DATABASE_URL;
const caPath = process.env.CA_PATH || resolve(cwd(), "ca.pem");

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required. Add it to your .env file.");
}

try {
  new URL(databaseUrl);
} catch {
  throw new Error(
    "DATABASE_URL is invalid. If the password contains special characters like #, @, :, or /, URL-encode them first.",
  );
}

const pool = new Pool({
  connectionString: databaseUrl,
  ssl:
    process.env.NODE_ENV === "production"
      ? {
          rejectUnauthorized: true,
          ca: readFileSync(caPath).toString(),
        }
      : false,
});

export async function dbQuery<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<QueryResult<T>> {
  return pool.query<T>(text, params);
}

export default pool;
