import express from 'express';
import { createServer as createViteServer } from 'vite';
import db from './src/db/index.js';
import logger from './src/utils/logger.js';

export const app = express();

app.use(express.json());


  // Authentication Middleware
  let cachedAuth: string | null = null;
  let cachedUsername: string | undefined = undefined;
  let cachedPassword: string | undefined = undefined;

  const getExpectedAuth = () => {
    if (process.env.ADMIN_USERNAME !== cachedUsername || process.env.ADMIN_PASSWORD !== cachedPassword) {
      cachedUsername = process.env.ADMIN_USERNAME;
      cachedPassword = process.env.ADMIN_PASSWORD;
      if (!cachedUsername || !cachedPassword) {
        cachedAuth = null;
      } else {
        cachedAuth = `Basic ${Buffer.from(`${cachedUsername}:${cachedPassword}`).toString('base64')}`;
      }
    }
    return cachedAuth;
  };

  const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const expectedAuth = getExpectedAuth();

    if (!expectedAuth) {
      logger.error('ADMIN_USERNAME or ADMIN_PASSWORD environment variables are not set');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const authHeader = req.headers.authorization || '';
    if (authHeader === expectedAuth) {
      return next();
    }

    res.set('WWW-Authenticate', 'Basic realm="API"');
    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    return res.status(401).json({ error: 'Invalid credentials' });
  };

  app.use('/api', (req, res, next) => {
    return requireAuth(req, res, next);
  });

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Products
app.get('/api/products', (req, res) => {
    const products = db.prepare('SELECT * FROM products ORDER BY name ASC').all();
    res.json(products);
  });

app.post('/api/products', (req, res) => {
    const { code, name, category, unit, price_ex_gst, gst_rate, hsn_code, stock } = req.body;
    if (typeof code !== 'string' || typeof name !== 'string' || typeof category !== 'string' ||
        typeof unit !== 'string' || typeof price_ex_gst !== 'number' || typeof gst_rate !== 'number' ||
        typeof hsn_code !== 'string' || (stock !== undefined && typeof stock !== 'number')) {
      return res.status(400).json({ error: 'Invalid or missing required fields' });
    }
    try {
      const stmt = db.prepare(`
        INSERT INTO products (code, name, category, unit, price_ex_gst, gst_rate, hsn_code, stock)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const info = stmt.run(code, name, category, unit, price_ex_gst, gst_rate, hsn_code, stock || 0);
      res.json({ id: info.lastInsertRowid });
    } catch (err: any) {
      res.status(400).json({ error: 'An error occurred while processing the request' });
    }
  });

app.put('/api/products/:id', (req, res) => {
    const { code, name, category, unit, price_ex_gst, gst_rate, hsn_code, stock } = req.body;
    if (typeof code !== 'string' || typeof name !== 'string' || typeof category !== 'string' ||
        typeof unit !== 'string' || typeof price_ex_gst !== 'number' || typeof gst_rate !== 'number' ||
        typeof hsn_code !== 'string' || (stock !== undefined && typeof stock !== 'number')) {
      return res.status(400).json({ error: 'Invalid or missing required fields' });
    }
    try {
      const stmt = db.prepare(`
        UPDATE products 
        SET code = ?, name = ?, category = ?, unit = ?, price_ex_gst = ?, gst_rate = ?, hsn_code = ?, stock = ?
        WHERE id = ?
      `);
      stmt.run(code, name, category, unit, price_ex_gst, gst_rate, hsn_code, stock || 0, req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: 'An error occurred while processing the request' });
    }
  });

app.delete('/api/products/:id', (req, res) => {
    try {
      db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: 'An error occurred while processing the request' });
    }
  });

  // Customers
app.get('/api/customers', (req, res) => {
    const search = req.query.search as string;
    if (search) {
      const customers = db.prepare(`
        SELECT c.*, COALESCE(SUM(i.grand_total), 0) as lifetime_value
        FROM customers c
        LEFT JOIN invoices i ON c.id = i.customer_id AND i.status = 'active'
        WHERE c.mobile LIKE ? OR c.name LIKE ?
        GROUP BY c.id
        LIMIT 10
      `).all(`%${search}%`, `%${search}%`);
      res.json(customers);
    } else {
      const customers = db.prepare(`
        SELECT c.*, COALESCE(SUM(i.grand_total), 0) as lifetime_value
        FROM customers c
        LEFT JOIN invoices i ON c.id = i.customer_id AND i.status = 'active'
        GROUP BY c.id
        ORDER BY c.name ASC
      `).all();
      res.json(customers);
    }
  });

app.post('/api/customers', (req, res) => {
    const { name, mobile, address, gstin, state } = req.body;
    try {
      const stmt = db.prepare(`
        INSERT INTO customers (name, mobile, address, gstin, state)
        VALUES (?, ?, ?, ?, ?)
      `);
      const info = stmt.run(name, mobile, address, gstin, state);
      res.json({ id: info.lastInsertRowid });
    } catch (err: any) {
      res.status(400).json({ error: 'An error occurred while processing the request' });
    }
  });

app.put('/api/customers/:id', (req, res) => {
    const { name, mobile, address, gstin, state } = req.body;
    try {
      const stmt = db.prepare(`
        UPDATE customers 
        SET name = ?, mobile = ?, address = ?, gstin = ?, state = ?
        WHERE id = ?
      `);
      stmt.run(name, mobile, address, gstin, state, req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: 'An error occurred while processing the request' });
    }
  });

  // Invoices
app.get('/api/invoices', (req, res) => {
    const invoices = db.prepare(`
      SELECT i.*, c.name as customer_name, c.mobile as customer_mobile
      FROM invoices i
      LEFT JOIN customers c ON i.customer_id = c.id
      ORDER BY i.date DESC, i.id DESC
    `).all();
    res.json(invoices);
  });

app.get('/api/invoices/:id', (req, res) => {
    const invoice = db.prepare(`
      SELECT i.*, c.name as customer_name, c.mobile as customer_mobile, c.address as customer_address, c.gstin as customer_gstin, c.state as customer_state
      FROM invoices i
      LEFT JOIN customers c ON i.customer_id = c.id
      WHERE i.id = ?
    `).get(req.params.id);

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const items = db.prepare('SELECT * FROM invoice_items WHERE invoice_id = ?').all(req.params.id);
    res.json({ ...invoice, items });
  });

app.post('/api/invoices', (req, res) => {
    const { 
      customer_id, type, subtotal, discount, cgst_total, sgst_total, igst_total, grand_total, items,
      customer_name, customer_mobile, customer_address, customer_gstin, customer_state,
      payment_status, amount_paid
    } = req.body;

    try {
      db.transaction(() => {
        let finalCustomerId = customer_id;
        
        // Create customer if it's a new B2B or Cash with details
        if (!finalCustomerId && customer_name) {
          const stmt = db.prepare('INSERT INTO customers (name, mobile, address, gstin, state) VALUES (?, ?, ?, ?, ?)');
          const info = stmt.run(customer_name, customer_mobile || null, customer_address || null, customer_gstin || null, customer_state || null);
          finalCustomerId = info.lastInsertRowid;
        }

        // Generate Invoice Number (RAC/YYYY-YY/XXXXX)
        const currentYear = new Date().getFullYear();
        const nextYear = (currentYear + 1).toString().slice(-2);
        const prefix = `RAC/${currentYear}-${nextYear}/`;
        
        const lastInvoice = db.prepare("SELECT invoice_number FROM invoices WHERE invoice_number LIKE ? ORDER BY id DESC LIMIT 1").get(`${prefix}%`) as { invoice_number: string } | undefined;
        
        let nextNumber = 1;
        if (lastInvoice) {
          const parts = lastInvoice.invoice_number.split('/');
          nextNumber = parseInt(parts[parts.length - 1], 10) + 1;
        }
        const invoice_number = `${prefix}${nextNumber.toString().padStart(5, '0')}`;

        const stmt = db.prepare(`
          INSERT INTO invoices (invoice_number, customer_id, type, subtotal, discount, cgst_total, sgst_total, igst_total, grand_total, payment_status, amount_paid)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        const info = stmt.run(invoice_number, finalCustomerId || null, type, subtotal, discount, cgst_total, sgst_total, igst_total || 0, grand_total, payment_status || 'Paid', amount_paid || grand_total);
        const invoiceId = info.lastInsertRowid;

        if (items && items.length > 0) {
          const MAX_VARIABLES = 32766;
          const CHUNK_SIZE_INSERT = Math.floor(MAX_VARIABLES / 13);

          let currentQuery = '';
          let currentLength = 0;

          for (let i = 0; i < items.length; i += CHUNK_SIZE_INSERT) {
            const chunk = items.slice(i, i + CHUNK_SIZE_INSERT);
            if (chunk.length !== currentLength) {
              currentLength = chunk.length;
              currentQuery = `
                INSERT INTO invoice_items (invoice_id, product_id, product_name, product_code, hsn_code, unit, quantity, price_ex_gst, gst_rate, cgst_amount, sgst_amount, igst_amount, total)
                VALUES ${chunk.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').join(', ')}
              `;
            }

            const insertValues = chunk.flatMap((item: any) => [
              invoiceId, item.product_id, item.product_name, item.product_code, item.hsn_code, item.unit,
              item.quantity, item.price_ex_gst, item.gst_rate, item.cgst_amount, item.sgst_amount, item.igst_amount || 0, item.total
            ]);
            db.prepare(currentQuery).run(...insertValues);
          }

          const updateStockStmt = db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?');
          for (const item of items) {
            if (item.product_id) {
              updateStockStmt.run(item.quantity, item.product_id);
            }
          }
        }

        return invoiceId;
      })();

      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: 'An error occurred while processing the request' });
    }
  });

app.put('/api/invoices/:id/cancel', (req, res) => {
    try {
      db.transaction(() => {
        const invoiceId = req.params.id;
        const invoice = db.prepare('SELECT status FROM invoices WHERE id = ?').get(invoiceId) as any;
        
        if (!invoice || invoice.status === 'cancelled') {
          throw new Error('Invoice not found or already cancelled');
        }

        // Restore stock
        db.prepare(`
          UPDATE products
          SET stock = products.stock + items.total_qty
          FROM (
            SELECT product_id, SUM(quantity) as total_qty
            FROM invoice_items
            WHERE invoice_id = ?
            GROUP BY product_id
          ) AS items
          WHERE products.id = items.product_id
        `).run(invoiceId);

        // Mark as cancelled
        db.prepare("UPDATE invoices SET status = 'cancelled' WHERE id = ?").run(invoiceId);
      })();
      res.json({ success: true });
    } catch (err: any) {
      // Allow specific error message for "Invoice not found or already cancelled"
      if (err.message === 'Invoice not found or already cancelled') {
        res.status(400).json({ error: err.message });
      } else {
        res.status(400).json({ error: 'An error occurred while processing the request' });
      }
    }
  });

app.put('/api/invoices/:id/payment', (req, res) => {
    const { payment_status, amount_paid } = req.body;
    try {
      db.prepare('UPDATE invoices SET payment_status = ?, amount_paid = ? WHERE id = ?')
        .run(payment_status, amount_paid, req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: 'An error occurred while processing the request' });
    }
  });

  // Settings
app.get('/api/settings', (req, res) => {
    const settings = db.prepare('SELECT * FROM settings LIMIT 1').get();
    res.json(settings);
  });

app.put('/api/settings', (req, res) => {
    const { store_name, address, phone, gstin, state_code, logo_url } = req.body;
    try {
      db.prepare(`
        UPDATE settings 
        SET store_name = ?, address = ?, phone = ?, gstin = ?, state_code = ?, logo_url = ?
        WHERE id = 1
      `).run(store_name, address, phone, gstin, state_code, logo_url);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: 'An error occurred while processing the request' });
    }
  });

  // Dashboard Analytics
app.get('/api/dashboard/analytics', (req, res) => {
    try {
      // Sales over last 7 days
      const last7Days = db.prepare(`
        SELECT date(date) as day, SUM(grand_total) as sales
        FROM invoices
        WHERE date >= date('now', '-7 days') AND status = 'active'
        GROUP BY date(date)
        ORDER BY date(date) ASC
      `).all();

      // Top 5 products
      const topProducts = db.prepare(`
        SELECT product_name as name, SUM(quantity) as qty, SUM(total) as revenue
        FROM invoice_items ii
        JOIN invoices i ON ii.invoice_id = i.id
        WHERE i.status = 'active'
        GROUP BY product_id
        ORDER BY qty DESC
        LIMIT 5
      `).all();

      // Low stock alerts
      const lowStock = db.prepare(`
        SELECT id, name, code, stock, unit
        FROM products
        WHERE stock <= 10
        ORDER BY stock ASC
        LIMIT 5
      `).all();

      res.json({ last7Days, topProducts, lowStock });
    } catch (err: any) {
      res.status(400).json({ error: 'An error occurred while processing the request' });
    }
  });

async function startServer() {
  const PORT = 3000;

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else if (process.env.NODE_ENV === 'production') {
    app.use(express.static('dist'));
    app.get('*', (req, res) => {
      res.sendFile('dist/index.html', { root: '.' });
    });
  }

  if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }

  return app;
}

export const appPromise = startServer();
