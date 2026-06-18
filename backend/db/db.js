// db.js - Simple SQLite3 wrapper (student style)
import sqlite3 from "sqlite3";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, "..", "database.db");
const schemaPath = join(__dirname, "schema.sql");

let db = null;

// Open the database (creates file if missing) and run schema
export function initDb() {
  return new Promise((resolve, reject) => {
    // Open database in read write mode, create if not exists
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        return reject(err);
      }
      // Read and execute schema
      const schema = readFileSync(schemaPath, "utf-8");
      db.exec(schema, (err) => {
        if (err) {
          return reject(err);
        }
        resolve(db);
      });
    });
  });
}

// Get the db instance (throws if not initialized)
export function getDb() {
  if (!db) {
    throw new Error("Database not initialized, call initDb() first");
  }
  return db;
}

// Run a query and return all rows (as array of objects)
export function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    getDb().all(sql, params, (err, rows) => {
      if (err) {
        return reject(err);
      }
      resolve(rows);
    });
  });
}

// Run a query and return the first row (or null)
export function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    getDb().get(sql, params, (err, row) => {
      if (err) {
        return reject(err);
      }
      resolve(row || null);
    });
  });
}

// Run an INSERT/UPDATE/DELETE and return { lastInsertRowid, changes }
export function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    getDb().run(sql, params, function (err) {
      if (err) {
        return reject(err);
      }
      resolve({
        lastInsertRowid: this.lastID,
        changes: this.changes,
      });
    });
  });
}

// Execute raw SQL (for schema, multiple statements)
export function exec(sql) {
  return new Promise((resolve, reject) => {
    getDb().exec(sql, (err) => {
      if (err) {
        return reject(err);
      }
      resolve();
    });
  });
}

export default { initDb, getDb, all, get, run, exec };
