// @vitest-environment node
import { test, describe, afterAll as after, assert } from 'vitest';
import request from 'supertest';
process.env.ADMIN_USERNAME = 'admin';
process.env.ADMIN_PASSWORD = 'password';
const authHeader = 'Basic ' + Buffer.from('admin:password').toString('base64');
import { app } from '../../server.js';
import db from '../db/index.js';

describe('Products API', () => {
  const testProduct = {
    code: 'TEST_DUP_01',
    name: 'Duplicate Test Product',
    category: 'Test',
    unit: 'pcs',
    price_ex_gst: 100,
    gst_rate: 18,
    hsn_code: '1234',
    stock: 10
  };

  after(() => {
    // Cleanup the database after tests
    db.prepare('DELETE FROM products WHERE code = ?').run(testProduct.code);
  });

  test('should return 400 when inserting a product with a duplicate code', async () => {
    // 1. Insert the product for the first time
    const res1 = await request(app)
      .post('/api/products')
      .set('Authorization', authHeader)
      .send(testProduct)
      .expect(200);

    assert.ok(res1.body.id, 'First insert should return an id');

    // 2. Insert the same product again to trigger UNIQUE constraint violation
    const res2 = await request(app)
      .post('/api/products')
      .set('Authorization', authHeader)
      .send(testProduct)
      .expect(400);

    assert.ok(res2.body.error, 'Response should contain an error message');
    assert.match(res2.body.error, /An error occurred while processing the request/, 'Error message should indicate failure');
  });
});
