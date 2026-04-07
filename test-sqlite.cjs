const Database = require('better-sqlite3');
const db = new Database(':memory:');
db.exec('CREATE TABLE test (id INTEGER)');
try {
  const stmt = db.prepare('SELECT * FROM test LIMIT 50 OFFSET -100');
  console.log(stmt.all());
} catch(e) {
  console.log("Error:", e.message);
}
