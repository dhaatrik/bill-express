import request from 'supertest';
import { appPromise } from './server.js';
import type { Express } from 'express';

process.env.NODE_ENV = 'test';
process.env.ADMIN_USERNAME = 'admin';
process.env.ADMIN_PASSWORD = 'password';

async function run() {
  const app = await appPromise;

  const auth = 'Basic ' + Buffer.from('admin:password').toString('base64');

  // Test putting XSS in logo_url
  const res = await request(app)
    .put('/api/settings')
    .set('Authorization', auth)
    .send({
      store_name: 'Store Name',
      address: 'Test Address',
      phone: '1234567890',
      gstin: 'GSTIN123',
      state_code: 'SC123',
      logo_url: 'javascript:alert(1)'
    });

  console.log(`PUT /api/settings response: ${res.status}`);
  console.log(`PUT /api/settings body: ${JSON.stringify(res.body)}`);
}

run();
