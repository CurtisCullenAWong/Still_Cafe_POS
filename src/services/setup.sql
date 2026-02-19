-- STILL CAFÉ POS - DATABASE INITIALIZATION
-- Unified Schema and Seed Data

-- 1. SCHEMA DEFINITIONS
-- Products Table
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    stock_qty INTEGER NOT NULL DEFAULT 0,
    image_uri TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);

-- Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Sales Table (Header)
CREATE TABLE IF NOT EXISTS sales (
    id TEXT PRIMARY KEY,
    total_amount REAL NOT NULL,
    vat_amount REAL NOT NULL,
    discount_amount REAL NOT NULL,
    discount_type TEXT,
    final_amount REAL NOT NULL,
    payment_method TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);

-- Sale Items Table (Details)
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
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id);

-- Settings Table (Singleton)
CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    store_name TEXT NOT NULL,
    vat_percentage REAL NOT NULL,
    senior_discount_percentage REAL NOT NULL,
    pwd_discount_percentage REAL NOT NULL
);

-- 2. SEED DATA
-- Default Settings
INSERT OR IGNORE INTO settings (id, store_name, vat_percentage, senior_discount_percentage, pwd_discount_percentage) 
VALUES (1, 'Still Café', 12, 20, 20);

-- Categories Initialization
INSERT OR IGNORE INTO categories (id, name, created_at) VALUES 
('cat_esp', 'Espresso-Based', CURRENT_TIMESTAMP),
('cat_spec', 'Special Drinks', CURRENT_TIMESTAMP),
('cat_nesp', 'Non-Espresso', CURRENT_TIMESTAMP),
('cat_cfrap', 'Coffee-Based Frappe', CURRENT_TIMESTAMP),
('cat_ncfrap', 'Non-Coffee Frappe', CURRENT_TIMESTAMP),
('cat_pasta', 'Pasta', CURRENT_TIMESTAMP),
('cat_rice', 'Rice Meals', CURRENT_TIMESTAMP),
('cat_snacks', 'Snacks', CURRENT_TIMESTAMP);

-- Official Products Seed
INSERT OR IGNORE INTO products (id, category, name, price, stock_qty, created_at) VALUES 
('1', 'Espresso-Based', 'Americano', 80, 50, CURRENT_TIMESTAMP),
('2', 'Espresso-Based', 'Café Latte', 100, 50, CURRENT_TIMESTAMP),
('3', 'Espresso-Based', 'Cappuccino', 100, 50, CURRENT_TIMESTAMP),
('4', 'Espresso-Based', 'Mocha', 130, 50, CURRENT_TIMESTAMP),
('5', 'Espresso-Based', 'White Chocolate Mocha', 130, 50, CURRENT_TIMESTAMP),
('6', 'Espresso-Based', 'Caramel Macchiatto', 140, 50, CURRENT_TIMESTAMP),
('7', 'Espresso-Based', 'Spanish Latte', 120, 50, CURRENT_TIMESTAMP),
('8', 'Espresso-Based', 'Vietnamese Latte', 120, 50, CURRENT_TIMESTAMP),
('9', 'Special Drinks', 'Iced Triple Kick', 150, 50, CURRENT_TIMESTAMP),
('10', 'Special Drinks', 'Iced Sea Salt Latte', 130, 50, CURRENT_TIMESTAMP),
('11', 'Non-Espresso', 'Iced Matcha Latte', 130, 50, CURRENT_TIMESTAMP),
('12', 'Non-Espresso', 'Iced Chocolate', 130, 50, CURRENT_TIMESTAMP),
('13', 'Non-Espresso', 'Still Iced Tea', 110, 50, CURRENT_TIMESTAMP),
('14', 'Coffee-Based Frappe', 'Java Chip', 135, 50, CURRENT_TIMESTAMP),
('15', 'Coffee-Based Frappe', 'Coffee Jelly', 135, 50, CURRENT_TIMESTAMP),
('16', 'Coffee-Based Frappe', 'Caramel Frappe', 120, 50, CURRENT_TIMESTAMP),
('17', 'Non-Coffee Frappe', 'Oreo', 130, 50, CURRENT_TIMESTAMP),
('18', 'Non-Coffee Frappe', 'Chocolate', 130, 50, CURRENT_TIMESTAMP),
('19', 'Non-Coffee Frappe', 'Strawberries & Cream', 140, 50, CURRENT_TIMESTAMP),
('20', 'Non-Coffee Frappe', 'Mangoes & Cream', 120, 50, CURRENT_TIMESTAMP),
('21', 'Pasta', 'Bolognese', 135, 30, CURRENT_TIMESTAMP),
('22', 'Pasta', 'Creamy Carbonara', 135, 30, CURRENT_TIMESTAMP),
('23', 'Rice Meals', 'Hungarian Sausage', 110, 30, CURRENT_TIMESTAMP),
('24', 'Rice Meals', 'Crispy Liempo', 135, 30, CURRENT_TIMESTAMP),
('25', 'Snacks', 'French Fries', 100, 40, CURRENT_TIMESTAMP),
('26', 'Snacks', 'Cheese Sticks', 80, 40, CURRENT_TIMESTAMP),
('27', 'Snacks', 'Cheese Quesadilla', 115, 40, CURRENT_TIMESTAMP),
('28', 'Snacks', 'Nacho-Nachos', 150, 40, CURRENT_TIMESTAMP),
('29', 'Snacks', 'Chicken Wings', 110, 40, CURRENT_TIMESTAMP);
