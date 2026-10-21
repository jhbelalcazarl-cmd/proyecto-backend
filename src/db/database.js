const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

const dbFile = path.resolve(process.env.DB_FILE || './data/app.db');
fs.mkdirSync(path.dirname(dbFile), { recursive: true });

const db = new sqlite3.Database(dbFile);

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (error) {
      if (error) return reject(error);
      resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}
function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (error, rows) => error ? reject(error) : resolve(rows));
  });
}
function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (error, row) => error ? reject(error) : resolve(row));
  });
}
function exec(sql) {
  return new Promise((resolve, reject) => {
    db.exec(sql, (error) => error ? reject(error) : resolve());
  });
}
function closeDatabase() {
  return new Promise((resolve, reject) => {
    db.close((error) => error ? reject(error) : resolve());
  });
}

async function initializeDatabase() {
  // Scripts versionados/controlados: se ejecutan en orden y una sola vez por versión.
  await exec(`CREATE TABLE IF NOT EXISTS schema_migrations (
    version TEXT PRIMARY KEY,
    applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );`);

  const migration = await get(
    'SELECT version FROM schema_migrations WHERE version = ?',
    ['001_initial']
  );

  if (!migration) {
    const schema = fs.readFileSync(path.join(__dirname, 'migrations', '001_initial.sql'), 'utf8');
    const seed = fs.readFileSync(path.join(__dirname, 'migrations', '002_seed_countries.sql'), 'utf8');
    await exec('BEGIN TRANSACTION;');
    try {
      await exec(schema);
      await exec(seed);
      await run('INSERT INTO schema_migrations(version) VALUES (?)', ['001_initial']);
      await run('INSERT INTO schema_migrations(version) VALUES (?)', ['002_seed_countries']);
      await exec('COMMIT;');
    } catch (error) {
      await exec('ROLLBACK;');
      throw error;
    }
  } else {
    const seedMigration = await get(
      'SELECT version FROM schema_migrations WHERE version = ?',
      ['002_seed_countries']
    );
    if (!seedMigration) {
      const seed = fs.readFileSync(path.join(__dirname, 'migrations', '002_seed_countries.sql'), 'utf8');
      await exec(seed);
      await run('INSERT INTO schema_migrations(version) VALUES (?)', ['002_seed_countries']);
    }
  }
}

module.exports = { db, run, all, get, exec, initializeDatabase, closeDatabase };
