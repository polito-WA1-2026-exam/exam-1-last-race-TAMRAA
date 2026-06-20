import sqlite from "sqlite3";

// Open the database
const db = new sqlite.Database("database.sqlite", (err) => {
  if (err) throw err;
});

export default db;
