import express from 'express';
import { createServer as createViteServer } from 'vite';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';
import db from './src/db/index.js';
import logger from './src/utils/logger.js';
import { getNextInvoiceNumber } from './src/utils/invoice.js';

export const app = express();

app.disable('x-powered-by');

// Trust the first proxy in front of the app (e.g., Nginx, Heroku) for accurate client IPs
app.set('trust proxy', 1);

app.use(express.json({ limit: '1mb' }));

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  // Security Enhancement: Content Security Policy to mitigate XSS
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: http:; font-src 'self' data: https: http:; connect-src 'self'");
  next();
});

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

    const expectedBuffer = Buffer.from(expectedAuth);
    const providedBuffer = Buffer.from(authHeader);

    let valid = false;
    if (expectedBuffer.length === providedBuffer.length) {
      valid = crypto.timingSafeEqual(expectedBuffer, providedBuffer);
    } else {
      crypto.timingSafeEqual(expectedBuffer, expectedBuffer);
      valid = false;
    }

    if (valid) {
      return next();
    }

    res.set('WWW-Authenticate', 'Basic realm="API"');
    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    return res.status(401).json({ error: 'Invalid credentials' });
  };

  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
    standardHeaders: 'draft-8', // draft-6: `RateLimit-*` headers; draft-7 & draft-8: combined `RateLimit` header
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
    handler: (req, res, next, options) => {
      logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
      res.status(options.statusCode).json({ error: 'Too many requests, please try again later.' });
    },
  });

  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 5, // Limit each IP to 5 requests per `window` (here, per 15 minutes).
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (req, res, next, options) => {
      logger.warn(`Login rate limit exceeded for IP: ${req.ip}`);
      res.status(options.statusCode).json({ error: 'Too many login attempts, please try again later.' });
    },
  });

  app.get('/api/login', loginLimiter, (req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    return requireAuth(req, res, next);
  }, (req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api', apiLimiter, (req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    return requireAuth(req, res, next);
  });

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

const isValidAmount = (n: any) => typeof n === 'number' && Number.isFinite(n) && n >= 0;

  // Products
app.get('/api/products', (req, res) => {
    let page = parseInt(req.query.page as string) || 1;
    let limit = parseInt(req.query.limit as string) || 50;

    // Security Enhancement: Prevent negative limits/offsets (DoS risk)
    if (page < 1) page = 1;
    if (limit < 1) limit = 1;
    if (limit > 1000) limit = 1000;

    const search = req.query.search as string || '';
    const category = req.query.category as string || 'All';
    const sort = req.query.sort as string || 'name_asc';

    let query = 'SELECT * FROM products';
    let countQuery = 'SELECT COUNT(*) as count FROM products';
    const params: any[] = [];
    const conditions: string[] = [];

    if (search) {
      conditions.push('(name LIKE ? OR code LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    if (category !== 'All') {
      conditions.push('category = ?');
      params.push(category);
    }

    if (conditions.length > 0) {
      const whereClause = ' WHERE ' + conditions.join(' AND ');
      query += whereClause;
      countQuery += whereClause;
    }

    if (sort === 'name_asc') query += ' ORDER BY name ASC';
    else if (sort === 'name_desc') query += ' ORDER BY name DESC';
    else if (sort === 'price_asc') query += ' ORDER BY price_ex_gst ASC';
    else if (sort === 'price_desc') query += ' ORDER BY price_ex_gst DESC';
    else query += ' ORDER BY name ASC';

    query += ' LIMIT ? OFFSET ?';

    try {
      const totalResult = db.prepare(countQuery).get(...params) as { count: number };
      const products = db.prepare(query).all(...params, limit, (page - 1) * limit);
      res.json({ data: products, total: totalResult.count });
    } catch (err: any) {
      logger.error({ err }, 'Operation failed');
      res.status(500).json({ error: 'An error occurred while processing the request' });
    }
  });

app.post('/api/products', (req, res) => {
    const { code, name, category, unit, price_ex_gst, gst_rate, hsn_code, stock } = req.body;
    if (typeof code !== 'string' || typeof name !== 'string' || typeof category !== 'string' ||
        typeof unit !== 'string' || !isValidAmount(price_ex_gst) || !isValidAmount(gst_rate) ||
        typeof hsn_code !== 'string' || (stock !== undefined && !isValidAmount(stock))) {
      return res.status(400).json({ error: 'Invalid or missing required fields' });
    }
    try {
      const stmt = db.prepare(`
        INSERT INTO products (code, name, category, unit, price_ex_gst, gst_rate, hsn_code, stock)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const info = stmt.run(code, name, category, unit, price_ex_gst, gst_rate, hsn_code, stock || 0);
      res.json({ id: info.lastInsertRowid });
    } catch (err) {
      logger.error({ err }, 'Operation failed');
      if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        return res.status(400).json({ error: 'An error occurred while processing the request' });
      }
      res.status(500).json({ error: 'An error occurred while processing the request' });
    }
  });

app.put('/api/products/:id', (req, res) => {
    const { code, name, category, unit, price_ex_gst, gst_rate, hsn_code, stock } = req.body;
    if (typeof code !== 'string' || typeof name !== 'string' || typeof category !== 'string' ||
        typeof unit !== 'string' || !isValidAmount(price_ex_gst) || !isValidAmount(gst_rate) ||
        typeof hsn_code !== 'string' || (stock !== undefined && !isValidAmount(stock))) {
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
    } catch (err) {
      logger.error({ err }, 'Operation failed');
      res.status(500).json({ error: 'An error occurred while processing the request' });
    }
  });

app.delete('/api/products/:id', (req, res) => {
    try {
      db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
      res.json({ success: true });
    } catch (err) {
      logger.error({ err }, 'Operation failed');
      res.status(500).json({ error: 'An error occurred while processing the request' });
    }
  });

  // Customers
app.get('/api/customers/count', (req, res) => {
    try {
      const result = db.prepare('SELECT COUNT(*) as count FROM customers').get() as { count: number };
      res.json(result);
    } catch (err) {
      logger.error({ err }, 'Operation failed');
      res.status(500).json({ error: 'An error occurred while processing the request' });
    }
  });

app.get('/api/customers', (req, res) => {
    const search = req.query.search as string;
    // ⚡ Bolt: Use scalar subquery instead of LEFT JOIN + GROUP BY for performance
    // See .jules/bolt.md for details
    if (search) {
      const customers = db.prepare(`
        SELECT c.*, (SELECT COALESCE(SUM(i.grand_total), 0) FROM invoices i WHERE i.customer_id = c.id AND i.status = 'active') as lifetime_value
        FROM customers c
        WHERE c.mobile LIKE ? OR c.name LIKE ?
        LIMIT 10
      `).all(`%${search}%`, `%${search}%`);
      res.json(customers);
    } else {
      const customers = db.prepare(`
        SELECT c.*, (SELECT COALESCE(SUM(i.grand_total), 0) FROM invoices i WHERE i.customer_id = c.id AND i.status = 'active') as lifetime_value
        FROM customers c
        ORDER BY c.name ASC
      `).all();
      res.json(customers);
    }
  });

app.post('/api/customers', (req, res) => {
    const { name, mobile, address, gstin, state } = req.body;
    if (
      typeof name !== 'string' ||
      (mobile !== undefined && typeof mobile !== 'string') ||
      (address !== undefined && typeof address !== 'string') ||
      (gstin !== undefined && typeof gstin !== 'string') ||
      (state !== undefined && typeof state !== 'string')
    ) {
      return res.status(400).json({ error: 'Invalid or missing required fields' });
    }
    try {
      const stmt = db.prepare(`
        INSERT INTO customers (name, mobile, address, gstin, state)
        VALUES (?, ?, ?, ?, ?)
      `);
      const info = stmt.run(name, mobile, address, gstin, state);
      res.json({ id: info.lastInsertRowid });
    } catch (err) {
      logger.error({ err }, 'Operation failed');
      res.status(500).json({ error: 'An error occurred while processing the request' });
    }
  });

app.put('/api/customers/:id', (req, res) => {
    const { name, mobile, address, gstin, state } = req.body;
    if (
      (name !== undefined && typeof name !== 'string') ||
      (mobile !== undefined && typeof mobile !== 'string') ||
      (address !== undefined && typeof address !== 'string') ||
      (gstin !== undefined && typeof gstin !== 'string') ||
      (state !== undefined && typeof state !== 'string')
    ) {
      return res.status(400).json({ error: 'Invalid or missing required fields' });
    }
    try {
      const stmt = db.prepare(`
        UPDATE customers 
        SET name = COALESCE(?, name), mobile = COALESCE(?, mobile), address = COALESCE(?, address), gstin = COALESCE(?, gstin), state = COALESCE(?, state)
        WHERE id = ?
      `);
      stmt.run(name, mobile, address, gstin, state, req.params.id);
      res.json({ success: true });
    } catch (err) {
      logger.error({ err }, 'Operation failed');
      res.status(500).json({ error: 'An error occurred while processing the request' });
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

    if (
      typeof type !== 'string' ||
      !isValidAmount(subtotal) ||
      !isValidAmount(discount) ||
      !isValidAmount(cgst_total) ||
      !isValidAmount(sgst_total) ||
      !isValidAmount(grand_total) ||
      (igst_total !== undefined && !isValidAmount(igst_total)) ||
      (customer_id !== undefined && customer_id !== null && typeof customer_id !== 'number') ||
      (customer_name !== undefined && typeof customer_name !== 'string') ||
      (customer_mobile !== undefined && typeof customer_mobile !== 'string') ||
      (customer_address !== undefined && typeof customer_address !== 'string') ||
      (customer_gstin !== undefined && typeof customer_gstin !== 'string') ||
      (customer_state !== undefined && typeof customer_state !== 'string') ||
      (payment_status !== undefined && typeof payment_status !== 'string') ||
      (amount_paid !== undefined && !isValidAmount(amount_paid)) ||
      !Array.isArray(items) ||
      !items.every(
        (item: any) =>
          item && typeof item === 'object' &&
          (item.product_id === undefined || item.product_id === null || typeof item.product_id === 'number') &&
          typeof item.product_name === 'string' &&
          typeof item.product_code === 'string' &&
          typeof item.hsn_code === 'string' &&
          typeof item.unit === 'string' &&
          isValidAmount(item.quantity) &&
          isValidAmount(item.price_ex_gst) &&
          isValidAmount(item.gst_rate) &&
          isValidAmount(item.cgst_amount) &&
          isValidAmount(item.sgst_amount) &&
          (item.igst_amount === undefined || isValidAmount(item.igst_amount)) &&
          isValidAmount(item.total)
      )
    ) {
      return res.status(400).json({ error: 'Invalid or missing required fields' });
    }

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
        const invoice_number = getNextInvoiceNumber(db);

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

          // Aggregate stock updates by product_id to prevent redundant updates for the same product
          const stockUpdates = new Map();
          for (const item of items) {
            if (item.product_id) {
              stockUpdates.set(item.product_id, (stockUpdates.get(item.product_id) || 0) + item.quantity);
            }
          }

          if (stockUpdates.size > 0) {
            const updateStockStmt = db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?');
            for (const [id, quantity] of stockUpdates.entries()) {
              updateStockStmt.run(quantity, id);
            }
          }
        }

        return invoiceId;
      })();

      res.json({ success: true });
    } catch (err) {
      logger.error({ err }, 'Operation failed');
      res.status(500).json({ error: 'An error occurred while processing the request' });
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
    } catch (err) {
      logger.error({ err }, 'Operation failed');
      // Allow specific error message for "Invoice not found or already cancelled"
      if (err instanceof Error && err.message === 'Invoice not found or already cancelled') {
        res.status(400).json({ error: err.message });
      } else {
        res.status(500).json({ error: 'An error occurred while processing the request' });
      }
    }
  });

app.put('/api/invoices/:id/payment', (req, res) => {
    const { payment_status, amount_paid } = req.body;
    if (
      (payment_status !== undefined && typeof payment_status !== 'string') ||
      (amount_paid !== undefined && !isValidAmount(amount_paid))
    ) {
      return res.status(400).json({ error: 'Invalid or missing required fields' });
    }

    try {
      db.prepare('UPDATE invoices SET payment_status = ?, amount_paid = ? WHERE id = ?')
        .run(payment_status, amount_paid, req.params.id);
      res.json({ success: true });
    } catch (err) {
      logger.error({ err }, 'Operation failed');
      res.status(500).json({ error: 'An error occurred while processing the request' });
    }
  });

  // Settings
app.get('/api/settings', (req, res) => {
    const settings = db.prepare('SELECT * FROM settings LIMIT 1').get();
    res.json(settings);
  });

app.put('/api/settings', (req, res) => {
    const { store_name, address, phone, gstin, state_code, logo_url } = req.body;
    if (typeof store_name !== 'string' || typeof address !== 'string' || typeof phone !== 'string' ||
        typeof gstin !== 'string' || typeof state_code !== 'string' ||
        (logo_url !== undefined && logo_url !== null && typeof logo_url !== 'string') ||
        (typeof logo_url === 'string' && logo_url !== '' && !/^https?:\/\//i.test(logo_url) && !logo_url.startsWith('/'))) {
      return res.status(400).json({ error: 'Invalid or missing required fields' });
    }
    try {
      db.prepare(`
        UPDATE settings 
        SET store_name = ?, address = ?, phone = ?, gstin = ?, state_code = ?, logo_url = ?
        WHERE id = 1
      `).run(store_name, address, phone, gstin, state_code, logo_url);
      res.json({ success: true });
    } catch (err) {
      logger.error({ err }, 'Operation failed');
      res.status(500).json({ error: 'An error occurred while processing the request' });
    }
  });

  // Dashboard Analytics
app.get('/api/dashboard/analytics', (req, res) => {
    try {
      // Overall Stats
      const stats = db.prepare(`
        SELECT
          (SELECT COUNT(*) FROM invoices WHERE date >= date('now', 'start of day') AND date < date('now', '+1 day', 'start of day') AND status = 'active') as todayInvoices,
          (SELECT COALESCE(SUM(grand_total), 0) FROM invoices WHERE date >= date('now', 'start of day') AND date < date('now', '+1 day', 'start of day') AND status = 'active') as todaySales,
          (SELECT COUNT(*) FROM products) as totalProducts,
          (SELECT COUNT(*) FROM customers) as totalCustomers
      `).get() as { todayInvoices: number, todaySales: number, totalProducts: number, totalCustomers: number };

      // Sales over last 7 days
      // ⚡ Bolt: Use exact string expression in ORDER BY to perfectly match idx_invoices_status_day index and prevent TEMP B-TREE sort
      const last7Days = db.prepare(`
        SELECT substr(date, 1, 10) as day, SUM(grand_total) as sales
        FROM invoices
        WHERE status = 'active' AND substr(date, 1, 10) >= date('now', '-7 days')
        GROUP BY substr(date, 1, 10)
        ORDER BY substr(date, 1, 10) ASC
      `).all();

      // Top 5 products
      // ⚡ Bolt: Replaced JOIN with EXISTS subquery to avoid large intermediate result sets and speed up aggregation
      const topProducts = db.prepare(`
        SELECT product_name as name, SUM(quantity) as qty, SUM(total) as revenue
        FROM invoice_items ii
        WHERE EXISTS (
          SELECT 1 FROM invoices i WHERE i.id = ii.invoice_id AND i.status = 'active'
        )
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

      res.json({ ...stats, last7Days, topProducts, lowStock });
    } catch (err: any) {
      logger.error({ err }, 'Operation failed');
      res.status(500).json({ error: 'An error occurred while processing the request' });
    }
  });

async function startServer() {
  const PORT = 3000;

  // Global Error Handler to prevent stack trace leaks on unexpected errors
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    logger.error({ err }, 'Unhandled exception');
    if (err.type === 'entity.too.large' || err.type === 'PayloadTooLargeError') {
      return res.status(413).json({ error: 'Payload Too Large' });
    }
    res.status(500).json({ error: 'An unexpected error occurred' });
  });

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
