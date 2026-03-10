import { test, describe, after } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
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
      .send(testProduct)
      .expect(200);

    assert.ok(res1.body.id, 'First insert should return an id');

    // 2. Insert the same product again to trigger UNIQUE constraint violation
    const res2 = await request(app)
      .post('/api/products')
      .send(testProduct)
      .expect(400);

    assert.ok(res2.body.error, 'Response should contain an error message');
    assert.match(res2.body.error, /UNIQUE constraint failed: products\.code/, 'Error message should indicate UNIQUE constraint failure');
  });
});
