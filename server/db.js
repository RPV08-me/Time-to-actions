const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const projectPath = path.resolve(__dirname, '..');
const dataPath = path.join(__dirname, 'data');
const databasePath = path.join(dataPath, 'database.sqlite');

fs.mkdirSync(dataPath, { recursive: true });

const db = new Database(databasePath);
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');
db.pragma('busy_timeout = 5000');

const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
db.exec(schema);

console.log('БД подключена:', databasePath);

module.exports = db;