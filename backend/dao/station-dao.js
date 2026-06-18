import { all, get, run } from "../db/db.js";

// Get all metro lines
export function getAllLines() {
  return all("SELECT * FROM lines");
}

// Get all stations
export function getAllStations() {
  return all("SELECT * FROM stations");
}

// Get stations for a specific line (in order)
export function getStationsByLine(lineId) {
  return all(
    `
    SELECT s.*, sl.sequence
    FROM stations s
    JOIN station_lines sl ON s.id = sl.station_id
    WHERE sl.line_id = ?
    ORDER BY sl.sequence
  `,
    [lineId],
  );
}

// Get all connections
export function getAllConnections() {
  return all("SELECT * FROM connections");
}

// Get connections for a specific station
export function getConnectionsForStation(stationId) {
  return all(
    `
    SELECT c.*, s.name as connected_station_name
    FROM connections c
    JOIN stations s ON c.station_b = s.id
    WHERE c.station_a = ?
  `,
    [stationId],
  );
}

// Get station-line relationships
export function getAllStationLines() {
  return all("SELECT * FROM station_lines");
}

// Get lines that a station belongs to
export function getLinesForStation(stationId) {
  return all(
    `
    SELECT l.*
    FROM lines l
    JOIN station_lines sl ON l.id = sl.line_id
    WHERE sl.station_id = ?
  `,
    [stationId],
  );
}

// Check if two stations are connected on the same line
export function areStationsConnected(stationA, stationB) {
  return get(
    `
    SELECT * FROM connections
    WHERE station_a = ? AND station_b = ?
  `,
    [stationA, stationB],
  );
}

// Get full metro data (for client)
export function getFullMetroData() {
  const lines = getAllLines();
  const stations = getAllStations();
  const connections = getAllConnections();
  const stationLines = getAllStationLines();

  // Build stations with their lines
  const stationsWithLines = stations.map((station) => {
    const stationLinesList = all(
      `
      SELECT l.id, l.name, l.color
      FROM lines l
      JOIN station_lines sl ON l.id = sl.line_id
      WHERE sl.station_id = ?
    `,
      [station.id],
    );

    return {
      ...station,
      lines: stationLinesList.map((l) => l.id),
      isInterchange: stationLinesList.length > 1,
    };
  });

  return {
    lines,
    stations: stationsWithLines,
    connections,
    stationLines,
  };
}
