// ============================================================
// SEED SCRIPT – Populates the database with Torino Metro data
// ============================================================
// Run with: node seed.mjs
// ============================================================

import db from "./db.mjs";
import crypto from "crypto";
import { readFileSync } from "fs";

// ---------- HELPER: promisify db methods ----------
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

// ---------- Helper: hash password ----------
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 32).toString("hex");
  return { salt, hash };
}

// ---------- Main seed function ----------
async function seed() {
  try {
    // 1. Create schema (if not exists)
    const schema = readFileSync("schema.sql", "utf-8");
    await exec(schema);
    console.log("✓ Schema created");

    // 2. Clear all existing data (respect foreign keys)
    console.log("Clearing existing data...");
    await exec("PRAGMA foreign_keys = OFF;");
    await exec("DELETE FROM game_score;");
    await exec("DELETE FROM game_session;");
    await exec("DELETE FROM connection;");
    await exec("DELETE FROM station_line;");
    await exec("DELETE FROM event;");
    await exec("DELETE FROM station;");
    await exec("DELETE FROM line;");
    await exec("DELETE FROM user;");
    await exec("PRAGMA foreign_keys = ON;");
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

    // ---------- LINES (Torino) ----------
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

    // ---------- STATIONS (Torino network – 13 stations) ----------
    const stations = [
      // Red Line (West → East)
      { id: "centrale", name: "Centrale", pos_x: 80, pos_y: 150 },
      { id: "porta_velaria", name: "Porta Velaria", pos_x: 170, pos_y: 150 },
      {
        id: "crocevia_falco",
        name: "Crocevia del Falco",
        pos_x: 260,
        pos_y: 150,
      },
      {
        id: "piazza_lanterne",
        name: "Piazza delle Lanterne",
        pos_x: 350,
        pos_y: 150,
      },
      { id: "porta_nuova", name: "Porta Nuova", pos_x: 450, pos_y: 150 },

      // Blue Line (North → South)
      { id: "fontana_oscura", name: "Fontana Oscura", pos_x: 400, pos_y: 50 },
      { id: "borgo_sereno", name: "Borgo Sereno", pos_x: 400, pos_y: 110 },
      {
        id: "viale_mosaici",
        name: "Viale dei Mosaici",
        pos_x: 400,
        pos_y: 170,
      },
      { id: "lingotto", name: "Lingotto", pos_x: 400, pos_y: 230 },

      // Green Line (North → South)
      { id: "torre_cinerea", name: "Torre Cinerea", pos_x: 170, pos_y: 50 },
      { id: "campo_eco", name: "Campo dell'Eco", pos_x: 170, pos_y: 230 },
      { id: "cenisia", name: "Cenisia", pos_x: 170, pos_y: 300 },

      // Yellow Line (East → West)
      { id: "rebaudengo", name: "Rebaudengo", pos_x: 400, pos_y: 320 },
    ];

    for (const s of stations) {
      await run(
        "INSERT INTO station (id, name, pos_x, pos_y) VALUES (?, ?, ?, ?)",
        [s.id, s.name, s.pos_x, s.pos_y],
      );
    }
    console.log("✓ Stations seeded (13 stations)");

    // ---------- STATION-LINE RELATIONSHIPS ----------
    const stationLines = [
      // Red Line
      { station: "centrale", line: "R", seq: 1 },
      { station: "porta_velaria", line: "R", seq: 2 },
      { station: "crocevia_falco", line: "R", seq: 3 },
      { station: "piazza_lanterne", line: "R", seq: 4 },
      { station: "porta_nuova", line: "R", seq: 5 },

      // Blue Line
      { station: "fontana_oscura", line: "B", seq: 1 },
      { station: "borgo_sereno", line: "B", seq: 2 },
      { station: "centrale", line: "B", seq: 3 },
      { station: "viale_mosaici", line: "B", seq: 4 },
      { station: "lingotto", line: "B", seq: 5 },

      // Green Line
      { station: "porta_velaria", line: "G", seq: 1 },
      { station: "fontana_oscura", line: "G", seq: 2 },
      { station: "torre_cinerea", line: "G", seq: 3 },
      { station: "campo_eco", line: "G", seq: 4 },
      { station: "cenisia", line: "G", seq: 5 },

      // Yellow Line
      { station: "piazza_lanterne", line: "Y", seq: 1 },
      { station: "torre_cinerea", line: "Y", seq: 2 },
      { station: "viale_mosaici", line: "Y", seq: 3 },
      { station: "campo_eco", line: "Y", seq: 4 },
      { station: "rebaudengo", line: "Y", seq: 5 },
    ];

    for (const sl of stationLines) {
      await run(
        "INSERT INTO station_line (station_id, line_id, sequence) VALUES (?, ?, ?)",
        [sl.station, sl.line, sl.seq],
      );
    }
    console.log("✓ Station-Line relationships seeded");

    // ---------- CONNECTIONS (bidirectional) ----------
    const connections = [
      // Red Line
      { a: "centrale", b: "porta_velaria", line: "R" },
      { a: "porta_velaria", b: "crocevia_falco", line: "R" },
      { a: "crocevia_falco", b: "piazza_lanterne", line: "R" },
      { a: "piazza_lanterne", b: "porta_nuova", line: "R" },

      // Blue Line
      { a: "fontana_oscura", b: "borgo_sereno", line: "B" },
      { a: "borgo_sereno", b: "centrale", line: "B" },
      { a: "centrale", b: "viale_mosaici", line: "B" },
      { a: "viale_mosaici", b: "lingotto", line: "B" },

      // Green Line
      { a: "porta_velaria", b: "fontana_oscura", line: "G" },
      { a: "fontana_oscura", b: "torre_cinerea", line: "G" },
      { a: "torre_cinerea", b: "campo_eco", line: "G" },
      { a: "campo_eco", b: "cenisia", line: "G" },

      // Yellow Line
      { a: "piazza_lanterne", b: "torre_cinerea", line: "Y" },
      { a: "torre_cinerea", b: "viale_mosaici", line: "Y" },
      { a: "viale_mosaici", b: "campo_eco", line: "Y" },
      { a: "campo_eco", b: "rebaudengo", line: "Y" },
    ];

    for (const c of connections) {
      // Insert both directions for bidirectional travel
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

    // ---------- EVENTS (Italian, 10 events) ----------
    const events = [
      {
        name: "Viaggio tranquillo",
        description: "Il viaggio procede senza intoppi.",
        effect: 0,
        prob: 0.15,
      },
      {
        name: "Piattaforma sbagliata",
        description: "Sei salito sulla piattaforma sbagliata, perdi tempo.",
        effect: -2,
        prob: 0.12,
      },
      {
        name: "Passeggero gentile",
        description: "Un passeggero ti offre una moneta per averlo aiutato.",
        effect: 1,
        prob: 0.1,
      },
      {
        name: "Controllo biglietti",
        description:
          "I controllori verificano il tuo biglietto. Tutto in regola.",
        effect: -1,
        prob: 0.08,
      },
      {
        name: "Ritardo segnale",
        description: "Un problema al segnale causa un ritardo.",
        effect: -3,
        prob: 0.12,
      },
      {
        name: "Treno affollato",
        description: "Il treno è troppo pieno, aspetti il prossimo.",
        effect: -1,
        prob: 0.1,
      },
      {
        name: "Portafoglio trovato",
        description:
          "Trovi un portafoglio smarrito e lo restituisci. Ricompensa!",
        effect: 4,
        prob: 0.08,
      },
      {
        name: "Sciopero parziale",
        description: "Uno sciopero riduce la frequenza dei treni.",
        effect: -2,
        prob: 0.1,
      },
      {
        name: "Corsa fortunata",
        description: "Il treno arriva proprio mentre arrivi in stazione!",
        effect: 2,
        prob: 0.1,
      },
      {
        name: "Musica dal vivo",
        description: "Un musicista rallegra il viaggio. Ti senti generoso.",
        effect: 1,
        prob: 0.05,
      },
    ];

    for (const e of events) {
      await run(
        "INSERT INTO event (name, description, coin_effect, probability) VALUES (?, ?, ?, ?)",
        [e.name, e.description, e.effect, e.prob],
      );
    }
    console.log("✓ Events seeded (10 events)");

    // ---------- GAME SCORES (for Mario and Luigi) ----------
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
      { user_id: mario.id, score: 45, rounds: 3, coins: 12 },
      { user_id: mario.id, score: 62, rounds: 5, coins: 8 },
      { user_id: mario.id, score: 38, rounds: 4, coins: 15 },
      { user_id: luigi.id, score: 28, rounds: 2, coins: 18 },
      { user_id: luigi.id, score: 51, rounds: 4, coins: 10 },
    ];

    for (const s of scores) {
      await run(
        "INSERT INTO game_score (user_id, score, rounds_completed, coins_remaining) VALUES (?, ?, ?, ?)",
        [s.user_id, s.score, s.rounds, s.coins],
      );
    }
    console.log("✓ Game scores seeded (Mario & Luigi)");

    console.log("\n✅ Database seeded successfully with Torino data!");
    console.log("Users: mario@polito.it, luigi@polito.it, peach@polito.it");
    console.log("Password for all: password123");
    console.log("\n📋 Metro Network:");
    console.log(
      "  🔴 Red Line:   Centrale → Porta Velaria → Crocevia del Falco → Piazza delle Lanterne → Porta Nuova",
    );
    console.log(
      "  🔵 Blue Line:  Fontana Oscura → Borgo Sereno → Centrale → Viale dei Mosaici → Lingotto",
    );
    console.log(
      "  🟢 Green Line: Porta Velaria → Fontana Oscura → Torre Cinerea → Campo dell'Eco → Cenisia",
    );
    console.log(
      "  🟡 Yellow Line: Piazza delle Lanterne → Torre Cinerea → Viale dei Mosaici → Campo dell'Eco → Rebaudengo",
    );
    console.log(
      "\n  Interchange stations: Centrale, Porta Velaria, Fontana Oscura, Piazza delle Lanterne, Torre Cinerea, Viale dei Mosaici",
    );
  } catch (err) {
    console.error("Seed error:", err);
    process.exit(1);
  }
}

// Run the seed
seed();
