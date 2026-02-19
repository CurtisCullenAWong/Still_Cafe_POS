import * as SQLite from "expo-sqlite";
import { Asset } from "expo-asset";
// Update your import to point to the legacy API
import * as FileSystem from "expo-file-system/legacy";

const DB_NAME = "pos.db";

let dbInstance: SQLite.SQLiteDatabase | null = null;

export const getDB = async () => {
  if (dbInstance) return dbInstance;

  const db = await SQLite.openDatabaseAsync(DB_NAME);
  // Important: PRAGMAs should be set on every new connection
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
  `);
  dbInstance = db;
  return db;
};

/**
 * Initializes the database using the unified setup SQL (schema + seeds).
 */
export const initDatabase = async () => {
  const db = await getDB();

  try {
    const setupAsset = Asset.fromModule(require("./setup.sql"));
    await setupAsset.downloadAsync();
    const setupSql = await FileSystem.readAsStringAsync(setupAsset.localUri!);

    // Execute the unified setup script
    // This includes CREATE TABLE IF NOT EXISTS and INSERT OR IGNORE statements
    await db.execAsync(setupSql);

    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Database initialization failed:", error);
    throw error;
  }
};
