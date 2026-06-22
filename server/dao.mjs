import db from "./db.mjs";

// ---------- USERS ----------
export const getUserByEmail = (email) => {
  return new Promise((resolve, reject) => {
    db.get("SELECT * FROM user WHERE email = ?", [email], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

export const getAllUsers = () => {
  return new Promise((resolve, reject) => {
    db.all("SELECT id, email, name FROM user", (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

// ---------- LINES ----------
export const getAllLines = () => {
  return new Promise((resolve, reject) => {
    db.all("SELECT * FROM line", (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

// ---------- STATIONS ----------
export const getAllStations = () => {
  return new Promise((resolve, reject) => {
    db.all("SELECT * FROM station", (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

export const getStationById = (id) => {
  return new Promise((resolve, reject) => {
    db.get("SELECT * FROM station WHERE id = ?", [id], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

// ---------- STATION-LINE ----------
export const getStationLines = () => {
  return new Promise((resolve, reject) => {
    db.all("SELECT * FROM station_line", (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

export const getLinesForStation = (stationId) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT l.* FROM line l
      JOIN station_line sl ON l.id = sl.line_id
      WHERE sl.station_id = ?
    `;
    db.all(sql, [stationId], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

// ---------- CONNECTIONS ----------
export const getAllConnections = () => {
  return new Promise((resolve, reject) => {
    db.all("SELECT * FROM connection", (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

export const getConnectionsForStation = (stationId) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT * FROM connection
      WHERE station_a = ? OR station_b = ?
    `;
    db.all(sql, [stationId, stationId], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

// ---------- EVENTS ----------
export const getAllEvents = () => {
  return new Promise((resolve, reject) => {
    db.all("SELECT * FROM event", (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

export const getRandomEvent = () => {
  return new Promise((resolve, reject) => {
    db.all("SELECT * FROM event", (err, events) => {
      if (err) {
        reject(err);
        return;
      }
      const rand = Math.random();
      let cumulative = 0;
      for (const event of events) {
        cumulative += event.probability;
        if (rand <= cumulative) {
          resolve(event);
          return;
        }
      }
      resolve(events[events.length - 1]);
    });
  });
};

// ---------- GAME SESSIONS ----------
export const createGameSession = (userId, originId, destinationId) => {
  return new Promise((resolve, reject) => {
    const sql = `
      INSERT INTO game_session (user_id, origin_station, destination_station, coins)
      VALUES (?, ?, ?, 20)
    `;
    db.run(sql, [userId, originId, destinationId], function (err) {
      if (err) reject(err);
      else resolve(this.lastID);
    });
  });
};

export const getActiveSessionForUser = (userId) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT gs.*,
             os.name as origin_name,
             ds.name as destination_name
      FROM game_session gs
      JOIN station os ON gs.origin_station = os.id
      JOIN station ds ON gs.destination_station = ds.id
      WHERE gs.user_id = ? AND gs.is_active = 1
      ORDER BY gs.started_at DESC
      LIMIT 1
    `;
    db.get(sql, [userId], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

export const getGameSessionById = (id) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT gs.*,
             os.name as origin_name,
             ds.name as destination_name
      FROM game_session gs
      JOIN station os ON gs.origin_station = os.id
      JOIN station ds ON gs.destination_station = ds.id
      WHERE gs.id = ?
    `;
    db.get(sql, [id], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

export const updateGameSession = (
  id,
  coins,
  score,
  currentRound,
  originId,
  destinationId,
) => {
  return new Promise((resolve, reject) => {
    const sql = `
      UPDATE game_session
      SET coins = ?, score = ?, current_round = ?,
          origin_station = ?, destination_station = ?
      WHERE id = ?
    `;
    db.run(
      sql,
      [coins, score, currentRound, originId, destinationId, id],
      function (err) {
        if (err) reject(err);
        else resolve(this.changes);
      },
    );
  });
};

export const endGameSession = (id) => {
  return new Promise((resolve, reject) => {
    db.run(
      "UPDATE game_session SET is_active = 0 WHERE id = ?",
      [id],
      function (err) {
        if (err) reject(err);
        else resolve(this.changes);
      },
    );
  });
};

// ---------- GAME SCORES ----------
export const saveGameScore = (
  userId,
  score,
  roundsCompleted,
  coinsRemaining,
) => {
  return new Promise((resolve, reject) => {
    const sql = `
      INSERT INTO game_score (user_id, score, rounds_completed, coins_remaining)
      VALUES (?, ?, ?, ?)
    `;
    db.run(
      sql,
      [userId, score, roundsCompleted, coinsRemaining],
      function (err) {
        if (err) {
          console.error("❌ Error saving game score:", err);
          reject(err);
        } else {
          console.log(
            `✅ Score saved: user=${userId}, score=${score}, rounds=${roundsCompleted}, coins=${coinsRemaining}`,
          );
          resolve(this.lastID);
        }
      },
    );
  });
};

export const getTopScores = (limit = 10) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT gs.*, u.name as username
      FROM game_score gs
      JOIN user u ON gs.user_id = u.id
      ORDER BY gs.score DESC
      LIMIT ?
    `;
    db.all(sql, [limit], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

export const getUserScores = (userId) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT * FROM game_score
      WHERE user_id = ?
      ORDER BY played_at DESC
    `;
    db.all(sql, [userId], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

export const getUserBestScore = (userId) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT * FROM game_score
      WHERE user_id = ?
      ORDER BY score DESC
      LIMIT 1
    `;
    db.get(sql, [userId], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

// ---------- NETWORK HELPERS ----------
export const getFullMetroData = () => {
  return Promise.all([
    getAllLines(),
    getAllStations(),
    getAllConnections(),
    getStationLines(),
  ]).then(([lines, stations, connections, stationLines]) => {
    const stationsWithLines = stations.map((station) => {
      const linesForStation = stationLines
        .filter((sl) => sl.station_id === station.id)
        .map((sl) => sl.line_id);
      return {
        ...station,
        lines: linesForStation,
        isInterchange: linesForStation.length > 1,
      };
    });
    return { lines, stations: stationsWithLines, connections, stationLines };
  });
};

export const findReachableStations = (originId, minDistance) => {
  return new Promise((resolve, reject) => {
    db.all("SELECT * FROM connection", (err, connections) => {
      if (err) {
        reject(err);
        return;
      }
      const adj = {};
      connections.forEach((c) => {
        if (!adj[c.station_a]) adj[c.station_a] = [];
        if (!adj[c.station_b]) adj[c.station_b] = [];
        adj[c.station_a].push(c.station_b);
        adj[c.station_b].push(c.station_a);
      });
      const visited = new Set();
      const queue = [{ id: originId, distance: 0 }];
      const reachable = [];
      while (queue.length > 0) {
        const { id, distance } = queue.shift();
        if (visited.has(id)) continue;
        visited.add(id);
        if (distance >= minDistance) {
          reachable.push(id);
        }
        const neighbors = adj[id] || [];
        for (const neighbor of neighbors) {
          if (!visited.has(neighbor)) {
            queue.push({ id: neighbor, distance: distance + 1 });
          }
        }
      }
      resolve(reachable);
    });
  });
};

export const areStationsConnected = (a, b) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT * FROM connection
      WHERE (station_a = ? AND station_b = ?)
         OR (station_a = ? AND station_b = ?)
    `;
    db.get(sql, [a, b, b, a], (err, row) => {
      if (err) reject(err);
      else resolve(!!row);
    });
  });
};

export const getConnectingLines = (a, b) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT line_id FROM connection
      WHERE (station_a = ? AND station_b = ?)
         OR (station_a = ? AND station_b = ?)
    `;
    db.all(sql, [a, b, b, a], (err, rows) => {
      if (err) reject(err);
      else resolve(rows.map((r) => r.line_id));
    });
  });
};
