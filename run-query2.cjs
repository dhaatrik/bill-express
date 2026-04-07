const Database = require('better-sqlite3');
const db = new Database(':memory:');
db.exec('CREATE TABLE users (id INTEGER PRIMARY KEY, username TEXT)');
db.exec("INSERT INTO users (username) VALUES ('test')");
const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
try {
  console.log(stmt.all("' OR 1=1; --"));
} catch(e) {
  console.log("Error:", e.message);
}
