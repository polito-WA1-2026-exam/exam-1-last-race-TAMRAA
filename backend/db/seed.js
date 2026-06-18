// seed.js – Populates the database with initial data

import { initDb, run, exec } from "./db.js";
import bcrypt from "bcryptjs";

// Main seeding function
async function seed() {
  console.log("🌱 Seeding database...");

  // Step 1: Open database and create tables (if not exist)
  await initDb();
  console.log("✅ Database initialized");

  // Step 2: Clear old data (start fresh)
  await exec("DELETE FROM game_scores");
  await exec("DELETE FROM game_sessions");
  await exec("DELETE FROM connections");
  await exec("DELETE FROM station_lines");
  await exec("DELETE FROM stations");
  await exec("DELETE FROM lines");
  await exec("DELETE FROM events");
  await exec("DELETE FROM users");
  console.log("🧹 Cleared existing data");

  // ========== USERS ==========
  const users = [
    { username: "mario", email: "mario@polito.it", password: "password123" },
    { username: "luigi", email: "luigi@polito.it", password: "password123" },
    { username: "peach", email: "peach@polito.it", password: "password123" },
  ];

  for (const user of users) {
    const hash = bcrypt.hashSync(user.password, 10);
    await run(
      "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
      [user.username, user.email, hash],
    );
  }
  console.log("👤 Seeded users");

  // ========== METRO LINES ==========
  const lines = [
    { id: "M1", name: "Linea 1", color: "#E53935" },
    { id: "M2", name: "Linea 2", color: "#1E88E5" },
    { id: "M3", name: "Linea 3", color: "#43A047" },
    { id: "M4", name: "Linea 4", color: "#FDD835" },
  ];

  for (const line of lines) {
    await run("INSERT INTO lines (id, name, color) VALUES (?, ?, ?)", [
      line.id,
      line.name,
      line.color,
    ]);
  }
  console.log("🚇 Seeded metro lines");

  // ========== STATIONS ==========
  const stations = [
    // M1 (Red) – West to East
    { id: "fermi", name: "Fermi", pos_x: 50, pos_y: 180 },
    { id: "paradiso", name: "Paradiso", pos_x: 120, pos_y: 180 },
    { id: "massaua", name: "Massaua", pos_x: 190, pos_y: 180 },
    { id: "rivoli", name: "Rivoli", pos_x: 260, pos_y: 180 },
    { id: "porta_susa", name: "Porta Susa", pos_x: 330, pos_y: 180 },
    { id: "porta_nuova", name: "Porta Nuova", pos_x: 400, pos_y: 180 },
    { id: "nizza", name: "Nizza", pos_x: 470, pos_y: 180 },
    { id: "lingotto", name: "Lingotto", pos_x: 540, pos_y: 180 },

    // M2 (Blue) – North to South
    { id: "rebaudengo", name: "Rebaudengo", pos_x: 500, pos_y: 40 },
    { id: "bologna", name: "Bologna", pos_x: 500, pos_y: 85 },
    { id: "mole", name: "Mole Antonelliana", pos_x: 500, pos_y: 130 },
    // porta_nuova already added
    { id: "politecnico", name: "Politecnico", pos_x: 400, pos_y: 230 },
    { id: "mirafiori", name: "Mirafiori", pos_x: 400, pos_y: 280 },

    // M3 (Green) – North to South via Porta Susa
    { id: "juventus", name: "Juventus Stadium", pos_x: 250, pos_y: 40 },
    { id: "dora", name: "Dora", pos_x: 290, pos_y: 85 },
    // porta_susa already added
    { id: "san_paolo", name: "San Paolo", pos_x: 330, pos_y: 230 },
    { id: "cenisia", name: "Cenisia", pos_x: 330, pos_y: 280 },

    // M4 (Yellow) – connects via Mole and Rebaudengo
    { id: "valentino", name: "Parco Valentino", pos_x: 600, pos_y: 220 },
    { id: "gran_madre", name: "Gran Madre", pos_x: 600, pos_y: 160 },
    // mole already added
    { id: "aurora", name: "Aurora", pos_x: 550, pos_y: 65 },
    // rebaudengo already added
  ];

  for (const station of stations) {
    await run(
      "INSERT INTO stations (id, name, pos_x, pos_y) VALUES (?, ?, ?, ?)",
      [station.id, station.name, station.pos_x, station.pos_y],
    );
  }
  console.log("📍 Seeded stations");

  // ========== STATION–LINE RELATIONSHIPS ==========
  const stationLines = [
    // M1
    { station_id: "fermi", line_id: "M1", sequence: 1 },
    { station_id: "paradiso", line_id: "M1", sequence: 2 },
    { station_id: "massaua", line_id: "M1", sequence: 3 },
    { station_id: "rivoli", line_id: "M1", sequence: 4 },
    { station_id: "porta_susa", line_id: "M1", sequence: 5 },
    { station_id: "porta_nuova", line_id: "M1", sequence: 6 },
    { station_id: "nizza", line_id: "M1", sequence: 7 },
    { station_id: "lingotto", line_id: "M1", sequence: 8 },
    // M2
    { station_id: "rebaudengo", line_id: "M2", sequence: 1 },
    { station_id: "bologna", line_id: "M2", sequence: 2 },
    { station_id: "mole", line_id: "M2", sequence: 3 },
    { station_id: "porta_nuova", line_id: "M2", sequence: 4 },
    { station_id: "politecnico", line_id: "M2", sequence: 5 },
    { station_id: "mirafiori", line_id: "M2", sequence: 6 },
    // M3
    { station_id: "juventus", line_id: "M3", sequence: 1 },
    { station_id: "dora", line_id: "M3", sequence: 2 },
    { station_id: "porta_susa", line_id: "M3", sequence: 3 },
    { station_id: "san_paolo", line_id: "M3", sequence: 4 },
    { station_id: "cenisia", line_id: "M3", sequence: 5 },
    // M4
    { station_id: "valentino", line_id: "M4", sequence: 1 },
    { station_id: "gran_madre", line_id: "M4", sequence: 2 },
    { station_id: "mole", line_id: "M4", sequence: 3 },
    { station_id: "aurora", line_id: "M4", sequence: 4 },
    { station_id: "rebaudengo", line_id: "M4", sequence: 5 },
  ];

  for (const sl of stationLines) {
    await run(
      "INSERT INTO station_lines (station_id, line_id, sequence) VALUES (?, ?, ?)",
      [sl.station_id, sl.line_id, sl.sequence],
    );
  }
  console.log("🔗 Seeded station–line links");

  // ========== CONNECTIONS (adjacent stations) ==========
  const connections = [
    // M1
    { a: "fermi", b: "paradiso", line: "M1", time: 2 },
    { a: "paradiso", b: "massaua", line: "M1", time: 2 },
    { a: "massaua", b: "rivoli", line: "M1", time: 2 },
    { a: "rivoli", b: "porta_susa", line: "M1", time: 2 },
    { a: "porta_susa", b: "porta_nuova", line: "M1", time: 3 },
    { a: "porta_nuova", b: "nizza", line: "M1", time: 2 },
    { a: "nizza", b: "lingotto", line: "M1", time: 2 },
    // M2
    { a: "rebaudengo", b: "bologna", line: "M2", time: 2 },
    { a: "bologna", b: "mole", line: "M2", time: 2 },
    { a: "mole", b: "porta_nuova", line: "M2", time: 3 },
    { a: "porta_nuova", b: "politecnico", line: "M2", time: 2 },
    { a: "politecnico", b: "mirafiori", line: "M2", time: 2 },
    // M3
    { a: "juventus", b: "dora", line: "M3", time: 2 },
    { a: "dora", b: "porta_susa", line: "M3", time: 2 },
    { a: "porta_susa", b: "san_paolo", line: "M3", time: 2 },
    { a: "san_paolo", b: "cenisia", line: "M3", time: 2 },
    // M4
    { a: "valentino", b: "gran_madre", line: "M4", time: 2 },
    { a: "gran_madre", b: "mole", line: "M4", time: 2 },
    { a: "mole", b: "aurora", line: "M4", time: 2 },
    { a: "aurora", b: "rebaudengo", line: "M4", time: 2 },
  ];

  // Insert both directions (bidirectional)
  for (const conn of connections) {
    await run(
      "INSERT INTO connections (station_a, station_b, line_id, travel_time) VALUES (?, ?, ?, ?)",
      [conn.a, conn.b, conn.line, conn.time],
    );
    await run(
      "INSERT INTO connections (station_a, station_b, line_id, travel_time) VALUES (?, ?, ?, ?)",
      [conn.b, conn.a, conn.line, conn.time],
    );
  }
  console.log("🚉 Seeded connections");

  // ========== EVENTS (8+ different events) ==========
  const events = [
    {
      type: "delay",
      name: "Ritardo Segnale",
      description:
        "Un problema al segnale causa un ritardo. Perdi tempo prezioso!",
      coin_effect: -5,
      probability: 0.15,
    },
    {
      type: "inspection",
      name: "Controllo Biglietti",
      description:
        "I controllori verificano il tuo biglietto. Tutto in regola, ma perdi tempo.",
      coin_effect: -10,
      probability: 0.1,
    },
    {
      type: "bonus",
      name: "Portafoglio Trovato",
      description:
        "Trovi un portafoglio smarrito e lo restituisci. Il proprietario ti ricompensa!",
      coin_effect: 15,
      probability: 0.08,
    },
    {
      type: "crowd",
      name: "Treno Affollato",
      description: "Il treno è troppo pieno! Devi aspettare il prossimo.",
      coin_effect: 0,
      probability: 0.12,
    },
    {
      type: "bonus",
      name: "Musicista di Strada",
      description:
        "Un musicista talentuoso rallegra il viaggio. Ti senti generoso!",
      coin_effect: 5,
      probability: 0.1,
    },
    {
      type: "delay",
      name: "Guasto Tecnico",
      description: "Un guasto tecnico blocca temporaneamente la linea.",
      coin_effect: -8,
      probability: 0.1,
    },
    {
      type: "delay",
      name: "Sciopero Parziale",
      description: "Uno sciopero riduce la frequenza dei treni.",
      coin_effect: -3,
      probability: 0.08,
    },
    {
      type: "bonus",
      name: "Corsa Fortunata",
      description:
        "Il treno arriva proprio mentre arrivi in stazione. Che fortuna!",
      coin_effect: 10,
      probability: 0.12,
    },
    {
      type: "none",
      name: "Viaggio Tranquillo",
      description: "Il viaggio procede senza intoppi.",
      coin_effect: 0,
      probability: 0.15,
    },
  ];

  for (const event of events) {
    await run(
      "INSERT INTO events (type, name, description, coin_effect, probability) VALUES (?, ?, ?, ?, ?)",
      [
        event.type,
        event.name,
        event.description,
        event.coin_effect,
        event.probability,
      ],
    );
  }
  console.log("🎲 Seeded events");

  // ========== SAMPLE GAME SCORES ==========
  const scores = [
    { user_id: 1, score: 450, rounds: 5, coins: 35 },
    { user_id: 1, score: 680, rounds: 8, coins: 20 },
    { user_id: 1, score: 520, rounds: 6, coins: 28 },
    { user_id: 2, score: 320, rounds: 4, coins: 45 },
    { user_id: 2, score: 410, rounds: 5, coins: 32 },
  ];

  for (const s of scores) {
    await run(
      "INSERT INTO game_scores (user_id, score, rounds_completed, coins_remaining) VALUES (?, ?, ?, ?)",
      [s.user_id, s.score, s.rounds, s.coins],
    );
  }
  console.log("🏆 Seeded game scores");

  // Done!
  console.log("\n✅ Database seeding completed!");
  console.log(
    "👤 Pre‑seeded users: mario, luigi, peach (password: password123)",
  );
}

// Run the seed and catch any errors
seed().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
