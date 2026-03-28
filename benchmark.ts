import Database from 'better-sqlite3';

// Create an in-memory database for safe benchmarking without affecting real data
const db = new Database(':memory:');

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    unit TEXT NOT NULL,
    price_ex_gst REAL NOT NULL,
    gst_rate REAL NOT NULL,
    hsn_code TEXT NOT NULL,
    stock REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    mobile TEXT,
    address TEXT,
    gstin TEXT,
    state TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_number TEXT UNIQUE NOT NULL,
    customer_id INTEGER,
    type TEXT NOT NULL,
    subtotal REAL NOT NULL,
    discount REAL DEFAULT 0,
    cgst_total REAL NOT NULL,
    sgst_total REAL NOT NULL,
    igst_total REAL DEFAULT 0,
    grand_total REAL NOT NULL,
    status TEXT DEFAULT 'active',
    payment_status TEXT DEFAULT 'Unpaid',
    amount_paid REAL DEFAULT 0,
    date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(customer_id) REFERENCES customers(id)
  );
`);

// Seed some data first
function seedData(numProducts: number, numCustomers: number) {
  console.log(`Seeding ${numProducts} products and ${numCustomers} customers into in-memory DB...`);

  const insertProduct = db.prepare(`
    INSERT INTO products (code, name, category, unit, price_ex_gst, gst_rate, hsn_code, stock)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  db.transaction(() => {
    for (let i = 0; i < numProducts; i++) {
      insertProduct.run(`P${i}`, `Product ${i}`, 'Fertilizer', 'Bag', 100, 5, '1234', 100);
    }
  })();

  const insertCustomer = db.prepare(`
    INSERT INTO customers (name, mobile, address, gstin, state)
    VALUES (?, ?, ?, ?, ?)
  `);

  db.transaction(() => {
    for (let i = 0; i < numCustomers; i++) {
      insertCustomer.run(`Customer ${i}`, `9999999999`, 'Address', '27AAAAA0000A1Z5', 'MH');
    }
  })();
}

function benchmarkOldApproach() {
  const start = performance.now();

  // Old approach: fetch all products
  const products = db.prepare('SELECT * FROM products ORDER BY name ASC').all();
  const totalProducts = products.length;

  // Old approach: fetch all customers
  const customers = db.prepare(`
    SELECT c.*, COALESCE(SUM(i.grand_total), 0) as lifetime_value
    FROM customers c
    LEFT JOIN invoices i ON c.id = i.customer_id AND i.status = 'active'
    GROUP BY c.id
    ORDER BY c.name ASC
  `).all();
  const totalCustomers = customers.length;

  const end = performance.now();
  return { time: end - start, totalProducts, totalCustomers };
}

function benchmarkNewApproach() {
  const start = performance.now();

  // New approach: Use the unified analytics endpoint stats query
  const stats = db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM invoices WHERE date >= date('now', 'start of day') AND date < date('now', '+1 day', 'start of day') AND status = 'active') as todayInvoices,
      (SELECT COALESCE(SUM(grand_total), 0) FROM invoices WHERE date >= date('now', 'start of day') AND date < date('now', '+1 day', 'start of day') AND status = 'active') as todaySales,
      (SELECT COUNT(*) FROM products) as totalProducts,
      (SELECT COUNT(*) FROM customers) as totalCustomers
  `).get() as { todayInvoices: number, todaySales: number, totalProducts: number, totalCustomers: number };

  const end = performance.now();
  return { time: end - start, totalProducts: stats.totalProducts, totalCustomers: stats.totalCustomers };
}

function runBenchmark(iterations = 10) {
  seedData(10000, 10000); // 10k of each to make the difference noticeable

  console.log('\\n--- Running Benchmarks ---');

  let oldTime = 0;
  for (let i = 0; i < iterations; i++) {
    const res = benchmarkOldApproach();
    oldTime += res.time;
  }
  console.log(`Old Approach (fetch all): ${(oldTime / iterations).toFixed(2)} ms avg`);

  let newTime = 0;
  for (let i = 0; i < iterations; i++) {
    const res = benchmarkNewApproach();
    newTime += res.time;
  }
  console.log(`New Approach (SQL COUNT): ${(newTime / iterations).toFixed(2)} ms avg`);

  const improvement = ((oldTime - newTime) / oldTime) * 100;
  console.log(`\\nImprovement: ${improvement.toFixed(2)}% faster`);
  console.log(`Speedup factor: ${(oldTime / newTime).toFixed(2)}x faster`);
}

runBenchmark();
