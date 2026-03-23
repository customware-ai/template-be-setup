import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import BetterSqlite3, { type Database as BetterSqliteDatabase } from "better-sqlite3";
import {
  drizzle,
  type BetterSQLite3Database,
} from "drizzle-orm/better-sqlite3";
import * as schema from "./schemas.js";

export type DatabaseClient = BetterSQLite3Database<typeof schema>;

/**
 * Resolves the sqlite file path for the current runtime.
 * Playwright uses the e2e-specific override to point the backend process at an
 * isolated database without changing the default local development database.
 */
function resolveDatabaseFilePath(): string {
  const configuredPath = process.env.E2E_DATABASE_FILE_PATH;
  if (configuredPath && configuredPath.trim().length > 0) {
    return path.isAbsolute(configuredPath)
      ? configuredPath
      : path.join(process.cwd(), configuredPath);
  }

  return path.join(process.cwd(), ".dbs", "database.db");
}

/**
 * Returns the active sqlite file path for the current process environment.
 */
export function getDatabaseFilePath(): string {
  return resolveDatabaseFilePath();
}

let sqlite: BetterSqliteDatabase | null = null;
let db: DatabaseClient | null = null;

/**
 * Ensures the local database directory exists before opening sqlite.
 */
function ensureDatabaseDirectory(databaseFilePath: string): void {
  const directory = path.dirname(databaseFilePath);
  if (!existsSync(directory)) {
    mkdirSync(directory, { recursive: true });
  }
}

/**
 * Initializes sqlite and Drizzle once per process.
 */
export function initializeDatabase(): DatabaseClient {
  if (sqlite && db) {
    return db;
  }

  const databaseFilePath = getDatabaseFilePath();
  ensureDatabaseDirectory(databaseFilePath);

  sqlite = new BetterSqlite3(databaseFilePath);
  sqlite.pragma("foreign_keys = ON");
  db = drizzle(sqlite, { schema });

  return db;
}

/**
 * Returns the shared database connection.
 */
export function getDatabase(): DatabaseClient {
  if (!sqlite || !db) {
    return initializeDatabase();
  }

  return db;
}

/**
 * Closes the shared sqlite handle so tests can swap database files safely.
 */
export function resetDatabaseConnection(): void {
  sqlite?.close();
  sqlite = null;
  db = null;
}
