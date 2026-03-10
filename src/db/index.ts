import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = path.resolve(process.cwd(), 'data.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'staff'
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    unit TEXT NOT NULL,
    price_ex_gst REAL NOT NULL,
    gst_rate REAL NOT NULL,
    hsn_code TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    mobile TEXT,
    address TEXT,
    gstin TEXT,
    state TEXT
  );

  CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_number TEXT UNIQUE NOT NULL,
    date DATETIME DEFAULT CURRENT_TIMESTAMP,
    customer_id INTEGER,
    type TEXT NOT NULL, -- 'cash' or 'b2b'
    subtotal REAL NOT NULL,
    discount REAL NOT NULL DEFAULT 0,
    cgst_total REAL NOT NULL,
    sgst_total REAL NOT NULL,
    igst_total REAL NOT NULL DEFAULT 0,
    grand_total REAL NOT NULL,
    FOREIGN KEY(customer_id) REFERENCES customers(id)
  );

  CREATE TABLE IF NOT EXISTS invoice_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_id INTEGER NOT NULL,
    product_id INTEGER,
    product_name TEXT NOT NULL,
    product_code TEXT NOT NULL,
    hsn_code TEXT NOT NULL,
    unit TEXT NOT NULL,
    quantity REAL NOT NULL,
    price_ex_gst REAL NOT NULL,
    gst_rate REAL NOT NULL,
    cgst_amount REAL NOT NULL,
    sgst_amount REAL NOT NULL,
    igst_amount REAL NOT NULL DEFAULT 0,
    total REAL NOT NULL,
    FOREIGN KEY(invoice_id) REFERENCES invoices(id),
    FOREIGN KEY(product_id) REFERENCES products(id)
  );
`);

try { db.exec("ALTER TABLE customers ADD COLUMN state TEXT"); } catch (e) {}
try { db.exec("ALTER TABLE invoices ADD COLUMN igst_total REAL NOT NULL DEFAULT 0"); } catch (e) {}
try { db.exec("ALTER TABLE invoice_items ADD COLUMN igst_amount REAL NOT NULL DEFAULT 0"); } catch (e) {}
try { db.exec("ALTER TABLE products ADD COLUMN stock REAL NOT NULL DEFAULT 0"); } catch (e) {}
try { db.exec("ALTER TABLE invoices ADD COLUMN status TEXT DEFAULT 'active'"); } catch (e) {}
try { db.exec("ALTER TABLE invoices ADD COLUMN payment_status TEXT DEFAULT 'Paid'"); } catch (e) {}
try { db.exec("ALTER TABLE invoices ADD COLUMN amount_paid REAL DEFAULT 0"); } catch (e) {}

db.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    store_name TEXT NOT NULL,
    address TEXT NOT NULL,
    phone TEXT NOT NULL,
    gstin TEXT NOT NULL,
    state_code TEXT NOT NULL,
    logo_url TEXT
  );
`);

const settingsCount = db.prepare('SELECT count(*) as c FROM settings').get() as { c: number };
if (settingsCount.c === 0) {
  db.prepare('INSERT INTO settings (store_name, address, phone, gstin, state_code) VALUES (?, ?, ?, ?, ?)').run(
    'Bill Express',
    '123 Market Road, District, West Bengal - 700001',
    '9876543210',
    '19AAAAA0000A1Z5',
    '19 (West Bengal)'
  );
}

// Seed some default products if empty
const sampleProducts = [
  { code: 'UR46', name: 'Urea 46%', category: 'Fertilizer', unit: 'Bag', price: 250.00, gst: 5, hsn: '31021000' },
  { code: 'MONO36', name: 'Monocrotophos 36% SL', category: 'Pesticide', unit: 'Litre', price: 450.00, gst: 18, hsn: '38089199' },
  { code: 'DAP1846', name: 'DAP 18:46:0', category: 'Fertilizer', unit: 'Bag', price: 1200.00, gst: 5, hsn: '31053000' },
  { code: 'GLY41', name: 'Glyphosate 41% SL', category: 'Herbicide', unit: 'Litre', price: 380.00, gst: 18, hsn: '38089390' },
  { code: 'NPK102626', name: 'NPK 10:26:26', category: 'Fertilizer', unit: 'Bag', price: 1450.00, gst: 5, hsn: '31052000' },
  { code: 'IMIDA17', name: 'Imidacloprid 17.8% SL', category: 'Pesticide', unit: 'Litre', price: 850.00, gst: 18, hsn: '38089119' },
  { code: 'MOP60', name: 'Muriate of Potash 60%', category: 'Fertilizer', unit: 'Bag', price: 950.00, gst: 5, hsn: '31042000' },
  { code: 'SSP16', name: 'Single Super Phosphate 16%', category: 'Fertilizer', unit: 'Bag', price: 420.00, gst: 5, hsn: '31031100' },
  { code: 'CHLOR20', name: 'Chlorpyrifos 20% EC', category: 'Pesticide', unit: 'Litre', price: 320.00, gst: 18, hsn: '38089199' },
  { code: 'MANC75', name: 'Mancozeb 75% WP', category: 'Fungicide', unit: 'Kg', price: 480.00, gst: 18, hsn: '38089290' },
  { code: 'ZINC33', name: 'Zinc Sulphate 33%', category: 'Micronutrient', unit: 'Kg', price: 650.00, gst: 12, hsn: '28332990' },
  { code: 'HYBPAD', name: 'Hybrid Paddy Seeds', category: 'Seeds', unit: 'Kg', price: 350.00, gst: 0, hsn: '10061010' },
  { code: 'TOMF1', name: 'Tomato Seeds (F1)', category: 'Seeds', unit: 'Pkt', price: 120.00, gst: 0, hsn: '12099140' },
  { code: 'NEEM10K', name: 'Neem Oil 10000 ppm', category: 'Bio-Pesticide', unit: 'Litre', price: 550.00, gst: 5, hsn: '15159020' },
  { code: 'SUL80', name: 'Sulphur 80% WDG', category: 'Fungicide', unit: 'Kg', price: 180.00, gst: 18, hsn: '38089290' },
  { code: 'CORA18', name: 'Coragen 18.5% SC', category: 'Pesticide', unit: 'ml', price: 1850.00, gst: 18, hsn: '38089199' }
];

const check = db.prepare('SELECT count(*) as c FROM products WHERE code = ?');
const insert = db.prepare('INSERT INTO products (code, name, category, unit, price_ex_gst, gst_rate, hsn_code, stock) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');

for (const p of sampleProducts) {
  if ((check.get(p.code) as any).c === 0) {
    insert.run(p.code, p.name, p.category, p.unit, p.price, p.gst, p.hsn, 100); // Default stock 100
  }
}

export default db;
