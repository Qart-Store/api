import "../src/config/env.js";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { Client } from "pg";

type MigrationDirection = "up" | "down";

type MigrationFilePair = {
  id: string;
  upPath: string;
  downPath: string;
};

const ROOT_DIR = path.resolve(__dirname, "..");
const MIGRATIONS_DIR = path.join(ROOT_DIR, "migrations");
const TABLE_NAME = "schema_migrations";

function assertDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;
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

  return databaseUrl;
}

async function getClient() {
  const client = new Client({ connectionString: assertDatabaseUrl() });
  await client.connect();
  return client;
}

async function ensureMigrationsTable(client: Client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
      id TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

function toMigrationId(fileName: string) {
  return fileName.replace(/\.(up|down)\.sql$/, "");
}

function isUpFile(fileName: string) {
  return fileName.endsWith(".up.sql");
}

function isDownFile(fileName: string) {
  return fileName.endsWith(".down.sql");
}

async function getMigrationPairs() {
  await fs.mkdir(MIGRATIONS_DIR, { recursive: true });
  const files = await fs.readdir(MIGRATIONS_DIR);

  const upFiles = files.filter(isUpFile).sort((a, b) => a.localeCompare(b));
  const downSet = new Set(files.filter(isDownFile));

  const pairs: MigrationFilePair[] = [];
  for (const up of upFiles) {
    const id = toMigrationId(up);
    const down = `${id}.down.sql`;

    if (!downSet.has(down)) {
      throw new Error(`Missing down migration for ${up}. Expected ${down}`);
    }

    pairs.push({
      id,
      upPath: path.join(MIGRATIONS_DIR, up),
      downPath: path.join(MIGRATIONS_DIR, down),
    });
  }

  return pairs;
}

async function getAppliedMigrationIds(client: Client) {
  const result = await client.query<{ id: string }>(
    `SELECT id FROM ${TABLE_NAME} ORDER BY id ASC;`,
  );

  return result.rows.map((row) => row.id);
}

async function applyMigration(client: Client, migration: MigrationFilePair) {
  const sql = await fs.readFile(migration.upPath, "utf8");

  await client.query("BEGIN");
  try {
    await client.query(sql);
    await client.query(`INSERT INTO ${TABLE_NAME}(id) VALUES ($1);`, [
      migration.id,
    ]);
    await client.query("COMMIT");
    console.log(`↑ Applied: ${migration.id}`);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

async function rollbackMigration(client: Client, migration: MigrationFilePair) {
  const sql = await fs.readFile(migration.downPath, "utf8");

  await client.query("BEGIN");
  try {
    await client.query(sql);
    await client.query(`DELETE FROM ${TABLE_NAME} WHERE id = $1;`, [
      migration.id,
    ]);
    await client.query("COMMIT");
    console.log(`↓ Rolled back: ${migration.id}`);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

async function runUp() {
  const client = await getClient();
  try {
    await ensureMigrationsTable(client);

    const [pairs, appliedIds] = await Promise.all([
      getMigrationPairs(),
      getAppliedMigrationIds(client),
    ]);

    const applied = new Set(appliedIds);
    const pending = pairs.filter((migration) => !applied.has(migration.id));

    if (!pending.length) {
      console.log("No pending migrations.");
      return;
    }

    for (const migration of pending) {
      await applyMigration(client, migration);
    }

    console.log(`Done. Applied ${pending.length} migration(s).`);
  } finally {
    await client.end();
  }
}

async function runDown(steps = 1) {
  const client = await getClient();
  try {
    await ensureMigrationsTable(client);

    const [pairs, appliedIds] = await Promise.all([
      getMigrationPairs(),
      getAppliedMigrationIds(client),
    ]);

    const byId = new Map(pairs.map((migration) => [migration.id, migration]));
    const targets = [...appliedIds].reverse().slice(0, steps);

    if (!targets.length) {
      console.log("No applied migrations to roll back.");
      return;
    }

    for (const id of targets) {
      const migration = byId.get(id);
      if (!migration) {
        throw new Error(`Migration files missing for applied migration: ${id}`);
      }

      await rollbackMigration(client, migration);
    }

    console.log(`Done. Rolled back ${targets.length} migration(s).`);
  } finally {
    await client.end();
  }
}

async function runStatus() {
  const client = await getClient();
  try {
    await ensureMigrationsTable(client);

    const [pairs, appliedIds] = await Promise.all([
      getMigrationPairs(),
      getAppliedMigrationIds(client),
    ]);

    const applied = new Set(appliedIds);

    if (!pairs.length) {
      console.log("No migration files found.");
      return;
    }

    for (const migration of pairs) {
      const status = applied.has(migration.id) ? "applied" : "pending";
      console.log(`${status.padEnd(7)} ${migration.id}`);
    }
  } finally {
    await client.end();
  }
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function timestamp() {
  const date = new Date();
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  const hh = String(date.getUTCHours()).padStart(2, "0");
  const mi = String(date.getUTCMinutes()).padStart(2, "0");
  const ss = String(date.getUTCSeconds()).padStart(2, "0");

  return `${yyyy}${mm}${dd}${hh}${mi}${ss}`;
}

async function runCreate(nameArg?: string) {
  const name = slugify(nameArg ?? "");
  if (!name) {
    throw new Error(
      "Migration name is required. Example: npm run migrate:create -- add_users_table",
    );
  }

  await fs.mkdir(MIGRATIONS_DIR, { recursive: true });

  const id = `${timestamp()}_${name}`;
  const upFile = path.join(MIGRATIONS_DIR, `${id}.up.sql`);
  const downFile = path.join(MIGRATIONS_DIR, `${id}.down.sql`);

  await fs.writeFile(upFile, "-- Write migration SQL for UP here\n", {
    flag: "wx",
  });
  await fs.writeFile(downFile, "-- Write migration SQL for DOWN here\n", {
    flag: "wx",
  });

  console.log("Created migration files:");
  console.log(path.relative(ROOT_DIR, upFile));
  console.log(path.relative(ROOT_DIR, downFile));
}

async function main() {
  const [, , command, commandArg] = process.argv;

  switch (command) {
    case "up":
      await runUp();
      break;
    case "down": {
      const parsed = Number(commandArg ?? "1");
      const steps =
        Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 1;
      await runDown(steps);
      break;
    }
    case "status":
      await runStatus();
      break;
    case "create":
      await runCreate(commandArg);
      break;
    default:
      console.log("Usage:");
      console.log("  npm run migrate:create -- <name>");
      console.log("  npm run migrate:up");
      console.log("  npm run migrate:down -- [steps]");
      console.log("  npm run migrate:status");
      process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
