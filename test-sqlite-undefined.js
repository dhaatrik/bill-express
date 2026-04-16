const Database = require('better-sqlite3');
const db = new Database(':memory:');
db.exec('CREATE TABLE test (a TEXT)');
db.prepare('INSERT INTO test (a) VALUES (?)').run('hello');
try {
  db.prepare('UPDATE test SET a = COALESCE(?, a)').run(undefined);
  console.log("Success");
} catch (e) {
  console.log("Error:", e.message);
}
