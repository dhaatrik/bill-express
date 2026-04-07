const Database = require('better-sqlite3');
const db = new Database(':memory:');
db.exec('CREATE TABLE users (id INTEGER PRIMARY KEY, username TEXT)');
db.exec("INSERT INTO users (username) VALUES ('test')");
const stmt = db.prepare('SELECT * FROM users LIMIT ? OFFSET ?');
try {
  console.log(stmt.all("10; DROP TABLE users;", 0));
} catch(e) {
  console.log("Error:", e.message);
}
