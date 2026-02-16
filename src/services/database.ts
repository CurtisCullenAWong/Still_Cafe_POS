import * as SQLite from "expo-sqlite";
import { Product, DEFAULT_SETTINGS } from "../types/db";

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

export const initDatabase = async () => {
  const db = await getDB();

  try {
    // Split schema into individual exec/run calls for better stability and error pinpointing
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        category TEXT NOT NULL,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        stock_qty INTEGER NOT NULL,
        image_uri TEXT,
        created_at TEXT NOT NULL
      );
    `);
    await db.execAsync(
      "CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);",
    );

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
    `);

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS sales (
        id TEXT PRIMARY KEY,
        total_amount REAL NOT NULL,
        vat_amount REAL NOT NULL,
        discount_amount REAL NOT NULL,
        discount_type TEXT,
        final_amount REAL NOT NULL,
        payment_method TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
    `);
    await db.execAsync(
      "CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);",
    );

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS sale_items (
        id TEXT PRIMARY KEY,
        sale_id TEXT NOT NULL,
        product_id TEXT NOT NULL,
        product_name TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        price REAL NOT NULL,
        FOREIGN KEY (sale_id) REFERENCES sales (id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products (id)
      );
    `);
    await db.execAsync(
      "CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id);",
    );

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        store_name TEXT NOT NULL,
        vat_percentage REAL NOT NULL,
        senior_discount_percentage REAL NOT NULL,
        pwd_discount_percentage REAL NOT NULL
      );
    `);

    // Initialize Default Settings
    const settingsResult = await db.getFirstAsync(
      "SELECT * FROM settings WHERE id = 1",
    );
    if (!settingsResult) {
      await db.runAsync(
        "INSERT INTO settings (id, store_name, vat_percentage, senior_discount_percentage, pwd_discount_percentage) VALUES (1, ?, ?, ?, ?)",
        DEFAULT_SETTINGS.store_name,
        DEFAULT_SETTINGS.vat_percentage,
        DEFAULT_SETTINGS.senior_discount_percentage,
        DEFAULT_SETTINGS.pwd_discount_percentage,
      );
    }
  } catch (error) {
    console.error("Database schema initialization failed:", error);
    throw error;
  }
};

export const seedCategoriesFunc = async (categories: string[]) => {
  const db = await getDB();
  const existing = await db.getFirstAsync("SELECT id FROM categories LIMIT 1");
  if (!existing) {
    console.log("Seeding categories...");
    for (const catName of categories) {
      const id =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : Math.random().toString(36).substring(2, 11) +
            Date.now().toString(36);
      await db.runAsync(
        "INSERT INTO categories (id, name, created_at) VALUES (?, ?, ?)",
        id,
        catName,
        new Date().toISOString(),
      );
    }
  }
};

export const seedProductsFunc = async (products: Product[]) => {
  const db = await getDB();
  const existing = await db.getFirstAsync("SELECT id FROM products LIMIT 1");
  if (!existing) {
    console.log("Seeding products...");
    for (const p of products) {
      await db.runAsync(
        "INSERT INTO products (id, category, name, price, stock_qty, image_uri, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
        p.id,
        p.category,
        p.name,
        p.price,
        p.stock_qty,
        p.image_uri || null,
        p.created_at,
      );
    }
  }
};
