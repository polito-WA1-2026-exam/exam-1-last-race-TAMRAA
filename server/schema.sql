-- Users
CREATE TABLE IF NOT EXISTS user (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  salt TEXT NOT NULL,
  saltedPassword TEXT NOT NULL
);

-- Metro lines
CREATE TABLE IF NOT EXISTS line (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL
);

-- Stations
CREATE TABLE IF NOT EXISTS station (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  pos_x REAL NOT NULL,
  pos_y REAL NOT NULL
);

-- Station-Line relationships (many-to-many)
CREATE TABLE IF NOT EXISTS station_line (
  station_id TEXT,
  line_id TEXT,
  sequence INTEGER,
  PRIMARY KEY (station_id, line_id),
  FOREIGN KEY (station_id) REFERENCES station(id),
  FOREIGN KEY (line_id) REFERENCES line(id)
);

-- Connections between stations (direct adjacency)
CREATE TABLE IF NOT EXISTS connection (
  station_a TEXT,
  station_b TEXT,
  line_id TEXT,
  PRIMARY KEY (station_a, station_b, line_id),
  FOREIGN KEY (station_a) REFERENCES station(id),
  FOREIGN KEY (station_b) REFERENCES station(id),
  FOREIGN KEY (line_id) REFERENCES line(id)
);

-- Events
CREATE TABLE IF NOT EXISTS event (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  coin_effect INTEGER NOT NULL,
  probability REAL NOT NULL
);

-- Active game sessions
CREATE TABLE IF NOT EXISTS game_session (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  origin_station TEXT NOT NULL,
  destination_station TEXT NOT NULL,
  coins INTEGER DEFAULT 20,
  score INTEGER DEFAULT 0,
  current_round INTEGER DEFAULT 1,
  is_active INTEGER DEFAULT 1,
  started_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES user(id),
  FOREIGN KEY (origin_station) REFERENCES station(id),
  FOREIGN KEY (destination_station) REFERENCES station(id)
);

-- Completed game scores
CREATE TABLE IF NOT EXISTS game_score (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  score INTEGER NOT NULL,
  rounds_completed INTEGER NOT NULL,
  coins_remaining INTEGER NOT NULL,
  played_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES user(id)
);