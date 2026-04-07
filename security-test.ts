import request from 'supertest';
import { appPromise } from './server.js';
import type { Express } from 'express';

process.env.NODE_ENV = 'test';
process.env.ADMIN_USERNAME = 'admin';
process.env.ADMIN_PASSWORD = 'password';

async function run() {
  const app = await appPromise;

  const auth = 'Basic ' + Buffer.from('admin:password').toString('base64');

  // Test rate limiting on an endpoint like /api/products by sending > 100 requests
  for(let i=0; i<105; i++) {
     const res = await request(app).get('/api/products').set('Authorization', auth);
     if (res.status === 429) {
        console.log(`Rate limited at request ${i}`);
        break;
     } else if (i === 104) {
        console.log(`Request 104 status: ${res.status}`);
     }
  }
}

run();
