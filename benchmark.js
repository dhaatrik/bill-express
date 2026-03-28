const db = require('better-sqlite3')('data.db');
const request = require('supertest');
const { appPromise } = require('./server.js'); // Assuming it exports appPromise or app

async function run() {
  const app = await appPromise;

  // Clean up
  db.prepare('DELETE FROM products').run();

  // Insert 10000 products
  const insert = db.prepare('INSERT INTO products (code, name, category, unit, price_ex_gst, gst_rate, hsn_code, stock) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  db.transaction(() => {
    for (let i = 0; i < 10000; i++) {
      insert.run(`P${i}`, `Product ${i}`, 'Fertilizer', 'Bag', 100, 5, '1234', 10);
    }
  })();

  const authHeader = 'Basic ' + Buffer.from('admin:password').toString('base64');
  process.env.ADMIN_USERNAME = 'admin';
  process.env.ADMIN_PASSWORD = 'password';

  console.time('Fetch All Products');
  const res = await request(app)
    .get('/api/products')
    .set('Authorization', authHeader);
  console.timeEnd('Fetch All Products');

  console.log('Response size:', JSON.stringify(res.body).length, 'bytes');

  // Clean up
  db.prepare('DELETE FROM products').run();
  process.exit(0);
}

run();
