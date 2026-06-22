// ============================================================
// SEED SCRIPT – Populates the database with Torino Metro data
// ============================================================
// Run with: node seed.mjs
// ============================================================

import db from "./db.mjs";
import crypto from "crypto";
import { readFileSync } from "fs";

// ---------- db methods ----------
function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function exec(sql) {
  return new Promise((resolve, reject) => {
    db.exec(sql, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

// ---------- hash password ----------
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 32).toString("hex");
  return { salt, hash };
}

// ---------- Main seed function ----------
async function seed() {
  try {
    // 1. Create schema
    const schema = readFileSync("schema.sql", "utf-8");
    await exec(schema);
    console.log("✓ Schema created");

    // 2. Clear all existing data
    console.log("Clearing existing data...");
    await exec("DELETE FROM game_score;");
    await exec("DELETE FROM game_session;");
    await exec("DELETE FROM connection;");
    await exec("DELETE FROM station_line;");
    await exec("DELETE FROM event;");
    await exec("DELETE FROM station;");
    await exec("DELETE FROM line;");
    await exec("DELETE FROM user;");
    console.log("✓ Existing data cleared");

    // ---------- USERS ----------
    const users = [
      { email: "mario@polito.it", name: "Mario", password: "password123" },
      { email: "luigi@polito.it", name: "Luigi", password: "password123" },
      { email: "peach@polito.it", name: "Peach", password: "password123" },
    ];

    for (const u of users) {
      const { salt, hash } = hashPassword(u.password);
      await run(
        "INSERT INTO user (email, name, salt, saltedPassword) VALUES (?, ?, ?, ?)",
        [u.email, u.name, salt, hash],
      );
    }
    console.log("✓ Users seeded");

    // ---------- LINES ----------
    const lines = [
      { id: "R", name: "Linea Rossa", color: "#E53935" },
      { id: "B", name: "Linea Blu", color: "#1E88E5" },
      { id: "G", name: "Linea Verde", color: "#43A047" },
      { id: "Y", name: "Linea Gialla", color: "#FDD835" },
    ];

    for (const l of lines) {
      await run("INSERT INTO line (id, name, color) VALUES (?, ?, ?)", [
        l.id,
        l.name,
        l.color,
      ]);
    }
    console.log("✓ Lines seeded");

    // ---------- STATIONS ----------
    const stations = [
      { id: "centrale", name: "Centrale", pos_x: 80, pos_y: 150 },
      { id: "porta_palazzo", name: "Porta Palazzo", pos_x: 170, pos_y: 150 },
      { id: "piazza_statuto", name: "Piazza Statuto", pos_x: 260, pos_y: 150 },
      { id: "piazza_castello", name: "Piazza Castello", pos_x: 350, pos_y: 150 },
      { id: "porta_nuova", name: "Porta Nuova", pos_x: 450, pos_y: 150 },
      { id: "superga", name: "Superga", pos_x: 400, pos_y: 50 },
      { id: "monte_cappucini", name: "Monte dei Cappucini", pos_x: 400, pos_y: 110 },
      { id: "barriera_milano", name: "Barriera Milano", pos_x: 400, pos_y: 170 },
      { id: "lingotto", name: "Lingotto", pos_x: 400, pos_y: 230 },
      { id: "juventus", name: "Juventus Stadium", pos_x: 170, pos_y: 50 },
      { id: "campus_einaudi", name: "Campus Einaudi", pos_x: 170, pos_y: 230 },
      { id: "cenisia", name: "Cenisia", pos_x: 170, pos_y: 300 },
      { id: "marconi", name: "Marconi", pos_x: 400, pos_y: 300 },
    ];

    for (const s of stations) {
      await run(
        "INSERT INTO station (id, name, pos_x, pos_y) VALUES (?, ?, ?, ?)",
        [s.id, s.name, s.pos_x, s.pos_y],
      );
    }
    console.log("✓ Stations seeded");

    // ---------- STATION-LINE RELATIONSHIPS ----------
    const stationLines = [
      { station: "centrale", line: "R", seq: 1 },
      { station: "porta_palazzo", line: "R", seq: 2 },
      { station: "piazza_statuto", line: "R", seq: 3 },
      { station: "piazza_castello", line: "R", seq: 4 },
      { station: "porta_nuova", line: "R", seq: 5 },
      { station: "superga", line: "B", seq: 1 },
      { station: "monte_cappucini", line: "B", seq: 2 },
      { station: "centrale", line: "B", seq: 3 },
      { station: "barriera_milano", line: "B", seq: 4 },
      { station: "lingotto", line: "B", seq: 5 },
      { station: "porta_palazzo", line: "G", seq: 1 },
      { station: "superga", line: "G", seq: 2 },
      { station: "juventus", line: "G", seq: 3 },
      { station: "campus_einaudi", line: "G", seq: 4 },
      { station: "cenisia", line: "G", seq: 5 },
      { station: "piazza_castello", line: "Y", seq: 1 },
      { station: "juventus", line: "Y", seq: 2 },
      { station: "barriera_milano", line: "Y", seq: 3 },
      { station: "campus_einaudi", line: "Y", seq: 4 },
      { station: "marconi", line: "Y", seq: 5 },
    ];

    for (const sl of stationLines) {
      await run(
        "INSERT INTO station_line (station_id, line_id, sequence) VALUES (?, ?, ?)",
        [sl.station, sl.line, sl.seq],
      );
    }
    console.log("✓ Station-Line relationships seeded");

    // ---------- CONNECTIONS ----------
    const connections = [
      // Red Line
      { a: "centrale", b: "porta_palazzo", line: "R" },
      { a: "porta_palazzo", b: "piazza_statuto", line: "R" },
      { a: "piazza_statuto", b: "piazza_castello", line: "R" },
      { a: "piazza_castello", b: "porta_nuova", line: "R" },
      // Blue Line
      { a: "superga", b: "monte_cappucini", line: "B" },
      { a: "monte_cappucini", b: "centrale", line: "B" },
      { a: "centrale", b: "barriera_milano", line: "B" },
      { a: "barriera_milano", b: "lingotto", line: "B" },
      // Green Line
      { a: "porta_palazzo", b: "superga", line: "G" },
      { a: "superga", b: "juventus", line: "G" },
      { a: "juventus", b: "campus_einaudi", line: "G" },
      { a: "campus_einaudi", b: "cenisia", line: "G" },
      // Yellow Line
      { a: "piazza_castello", b: "juventus", line: "Y" },
      { a: "juventus", b: "barriera_milano", line: "Y" },
      { a: "barriera_milano", b: "campus_einaudi", line: "Y" },
      { a: "campus_einaudi", b: "marconi", line: "Y" },
    ];

    for (const c of connections) {
      await run(
        "INSERT INTO connection (station_a, station_b, line_id) VALUES (?, ?, ?)",
        [c.a, c.b, c.line],
      );
      await run(
        "INSERT INTO connection (station_a, station_b, line_id) VALUES (?, ?, ?)",
        [c.b, c.a, c.line],
      );
    }
    console.log("✓ Connections seeded (bidirectional)");

    // ---------- EVENTS – Balanced (range -4 to +4) ----------
    const events = [
      // Positive events (sum of probabilities = 0.5)
      { name: "Found a coin", description: "You find a coin on the platform.", effect: 1, prob: 0.15 },
      { name: "Kind passenger", description: "A passenger gives you 2 coins for helping them.", effect: 2, prob: 0.10 },
      { name: "Bonus ride", description: "The conductor gives you 3 coins as a bonus.", effect: 3, prob: 0.05 },
      { name: "Lucky day", description: "A stroke of luck! You gain 4 coins.", effect: 4, prob: 0.02 },
      // Negative events (sum of probabilities = 0.5)
      { name: "Lost a coin", description: "You drop a coin on the train.", effect: -1, prob: 0.15 },
      { name: "Ticket fine", description: "You forgot to validate your ticket. Pay 2 coins.", effect: -2, prob: 0.10 },
      { name: "Delay penalty", description: "A delay costs you 3 coins in wasted time.", effect: -3, prob: 0.05 },
      { name: "Wallet stolen", description: "Your wallet is stolen! You lose 4 coins.", effect: -4, prob: 0.02 },
      // Neutral events (fill remaining probability)
      { name: "Smooth ride", description: "The journey goes perfectly. No change.", effect: 0, prob: 0.36 },
    ];

    for (const e of events) {
      await run(
        "INSERT INTO event (name, description, coin_effect, probability) VALUES (?, ?, ?, ?)",
        [e.name, e.description, e.effect, e.prob],
      );
    }
    console.log("✓ Events seeded (balanced ±4 with neutral)");

    // ---------- GAME SCORES ----------
    const mario = await get("SELECT id FROM user WHERE email = ?", [
      "mario@polito.it",
    ]);
    const luigi = await get("SELECT id FROM user WHERE email = ?", [
      "luigi@polito.it",
    ]);

    if (!mario || !luigi) {
      throw new Error("Could not find user IDs for Mario or Luigi");
    }

    const scores = [
      { user_id: mario.id, score: 12, rounds: 3, coins: 12 },
      { user_id: luigi.id, score: 18, rounds: 2, coins: 18 },
    ];

    for (const s of scores) {
      await run(
        "INSERT INTO game_score (user_id, score, rounds_completed, coins_remaining) VALUES (?, ?, ?, ?)",
        [s.user_id, s.score, s.rounds, s.coins],
      );
    }
    console.log("✓ Game scores seeded (Mario & Luigi)");

    console.log("\n✅ Database seeded successfully!");
    console.log("Users: mario@polito.it, luigi@polito.it, peach@polito.it");
    console.log("Password for all: password123");
    console.log("Events now balanced with effects from -4 to +4.");
  } catch (err) {
    console.error("Seed error:", err);
    process.exit(1);
  }
}

// Run the seed
seed();