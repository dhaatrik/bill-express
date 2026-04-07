const db = require('better-sqlite3')(':memory:');
db.exec('CREATE TABLE products (id INTEGER PRIMARY KEY, name TEXT)');
for(let i=0; i<100; i++) db.exec('INSERT INTO products (name) VALUES ("Product ' + i + '")');
const stmt = db.prepare('SELECT * FROM products LIMIT ? OFFSET ?');
console.log('LIMIT -1 OFFSET 0 count:', stmt.all(-1, 0).length);
