-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP   -- SQLite stores as TEXT
);

-- Metro lines
CREATE TABLE IF NOT EXISTS lines (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL
);

-- Metro stations
CREATE TABLE IF NOT EXISTS stations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  pos_x REAL NOT NULL,
  pos_y REAL NOT NULL
);

-- Station–Line relationships
CREATE TABLE IF NOT EXISTS station_lines (
  station_id TEXT,
  line_id TEXT,
  sequence INTEGER,
  PRIMARY KEY (station_id, line_id),
  FOREIGN KEY (station_id) REFERENCES stations(id) ON DELETE CASCADE,
  FOREIGN KEY (line_id) REFERENCES lines(id) ON DELETE CASCADE
);

-- Station connections (adjacency)
CREATE TABLE IF NOT EXISTS connections (
  station_a TEXT,
  station_b TEXT,
  line_id TEXT,
  travel_time INTEGER DEFAULT 2,
  PRIMARY KEY (station_a, station_b, line_id),
  FOREIGN KEY (station_a) REFERENCES stations(id) ON DELETE CASCADE,
  FOREIGN KEY (station_b) REFERENCES stations(id) ON DELETE CASCADE,
  FOREIGN KEY (line_id) REFERENCES lines(id) ON DELETE CASCADE
);

-- Events (8+ different events)
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  coin_effect INTEGER DEFAULT 0,
  probability REAL NOT NULL
);

-- Game scores
CREATE TABLE IF NOT EXISTS game_scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  score INTEGER NOT NULL,
  rounds_completed INTEGER NOT NULL,
  coins_remaining INTEGER NOT NULL,
  played_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Active game sessions
CREATE TABLE IF NOT EXISTS game_sessions (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  current_round INTEGER DEFAULT 1,
  score INTEGER DEFAULT 0,
  coins INTEGER DEFAULT 50,
  origin_station TEXT,
  destination_station TEXT,
  started_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);