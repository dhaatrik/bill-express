const http = require('http');
const Database = require('better-sqlite3');
const { spawn } = require('child_process');

async function requestEndpoint(path, authHeader) {
  return new Promise((resolve, reject) => {
    const start = process.hrtime.bigint();
    const req = http.get(`http://localhost:3000${path}`, {
      headers: { 'Authorization': authHeader }
    }, (res) => {
      let data = [];
      res.on('data', chunk => data.push(chunk));
      res.on('end', () => {
        const fullData = Buffer.concat(data);
        const end = process.hrtime.bigint();
        resolve({
          timeMs: Number(end - start) / 1000000,
          payloadBytes: fullData.length
        });
      });
    }).on('error', reject);
    req.end();
  });
}

async function runBenchmark() {
  console.log('Starting backend server for benchmark...');
  const serverProcess = spawn('npm', ['run', 'dev'], {
    env: { ...process.env, ADMIN_USERNAME: 'admin', ADMIN_PASSWORD: 'password' },
    stdio: 'ignore'
  });

  // Wait for server to start
  console.log('Waiting 5 seconds for server...');
  await new Promise(r => setTimeout(r, 5000));

  // Seed DB directly
  const db = new Database('data.db');
  console.log('Seeding 1000 customers...');

  const insertCustomer = db.prepare('INSERT INTO customers (name, mobile) VALUES (?, ?)');
  db.transaction(() => {
    for (let i = 0; i < 1000; i++) {
      insertCustomer.run(`Customer ${i}`, `1234567${i.toString().padStart(3, '0')}`);
    }
  })();
  console.log('Seeding complete.');
  db.close();

  const authHeader = 'Basic ' + Buffer.from('admin:password').toString('base64');

  try {
    // Warmup
    await requestEndpoint('/api/customers', authHeader);

    // Baseline: Fetch all customers
    let totalAllTime = 0;
    let payloadAll = 0;
    for (let i = 0; i < 10; i++) {
      const res = await requestEndpoint('/api/customers', authHeader);
      totalAllTime += res.timeMs;
      payloadAll = res.payloadBytes;
    }
    const avgAllTime = totalAllTime / 10;
    console.log(`\n[Baseline] GET /api/customers`);
    console.log(`Average Time: ${avgAllTime.toFixed(2)} ms`);
    console.log(`Payload Size: ${(payloadAll / 1024).toFixed(2)} KB`);

    // Attempt count endpoint if it exists
    let totalCountTime = 0;
    let payloadCount = 0;
    try {
      const firstCount = await requestEndpoint('/api/customers/count', authHeader);
      if (firstCount.payloadBytes > 0) {
        for (let i = 0; i < 10; i++) {
          const res = await requestEndpoint('/api/customers/count', authHeader);
          totalCountTime += res.timeMs;
          payloadCount = res.payloadBytes;
        }
        const avgCountTime = totalCountTime / 10;
        console.log(`\n[Optimization] GET /api/customers/count`);
        console.log(`Average Time: ${avgCountTime.toFixed(2)} ms`);
        console.log(`Payload Size: ${(payloadCount / 1024).toFixed(2)} KB`);

        console.log(`\nSpeedup: ${(avgAllTime / avgCountTime).toFixed(2)}x`);
        console.log(`Payload Reduction: ${(payloadAll / payloadCount).toFixed(2)}x`);
      }
    } catch (err) {
      console.log(`\n[Optimization] GET /api/customers/count (NOT IMPLEMENTED YET)`);
    }

  } catch (err) {
    console.error('Benchmark error:', err);
  } finally {
    serverProcess.kill();
  }
}

runBenchmark();
