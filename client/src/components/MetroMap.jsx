import { useMemo } from "react";

export default function MetroMap({
  metroData,
  route = [],
  origin,
  destination,
  onStationClick,
  disabled = false,
  showLines = true,
}) {
  const { stations, lines, connections } = metroData || {
    stations: [],
    lines: [],
    connections: [],
  };

  const lineConnections = useMemo(() => {
    const lookup = {};
    connections.forEach((c) => {
      if (!lookup[c.line_id]) lookup[c.line_id] = [];
      const exists = lookup[c.line_id].some(
        (l) =>
          (l.a === c.station_a && l.b === c.station_b) ||
          (l.a === c.station_b && l.b === c.station_a),
      );
      if (!exists) lookup[c.line_id].push({ a: c.station_a, b: c.station_b });
    });
    return lookup;
  }, [connections]);

  const stationLookup = useMemo(() => {
    const lookup = {};
    stations.forEach((s) => (lookup[s.id] = s));
    return lookup;
  }, [stations]);

  const isInRoute = (id) => route.includes(id);
  const routeIndex = (id) => route.indexOf(id);

  const getStationColor = (s) => {
    if (s.id === origin) return "#4CAF50";
    if (s.id === destination) return "#F44336";
    if (isInRoute(s.id)) return "#64B5F6";
    return "#FFFFFF";
  };

  const getStationStroke = (s) => {
    if (s.isInterchange) return "#333";
    const line = lines.find((l) => s.lines?.includes(l.id));
    return line ? line.color : "#666";
  };

  if (!metroData) return <div>Loading map...</div>;

  return (
    <div className="metro-map">
      <svg viewBox="0 0 700 340" preserveAspectRatio="xMidYMid meet">
        <rect x="0" y="0" width="700" height="340" fill="#0f0f1a" rx="8" />

        {showLines &&
          lines.map((line) => (
            <g key={line.id}>
              {(lineConnections[line.id] || []).map((conn, idx) => {
                const a = stationLookup[conn.a];
                const b = stationLookup[conn.b];
                if (!a || !b) return null;
                return (
                  <line
                    key={idx}
                    x1={a.pos_x}
                    y1={a.pos_y}
                    x2={b.pos_x}
                    y2={b.pos_y}
                    stroke={line.color}
                    strokeWidth="6"
                    strokeLinecap="round"
                    opacity="0.8"
                  />
                );
              })}
            </g>
          ))}

        {route.length > 1 && (
          <g>
            {route.slice(0, -1).map((id, idx) => {
              const a = stationLookup[id];
              const b = stationLookup[route[idx + 1]];
              if (!a || !b) return null;
              return (
                <line
                  key={idx}
                  x1={a.pos_x}
                  y1={a.pos_y}
                  x2={b.pos_x}
                  y2={b.pos_y}
                  stroke="#FFD700"
                  strokeWidth="4"
                  strokeDasharray="6,4"
                  opacity="0.9"
                />
              );
            })}
          </g>
        )}

        {stations.map((s) => (
          <g
            key={s.id}
            onClick={() => !disabled && onStationClick && onStationClick(s.id)}
            style={{ cursor: disabled ? "default" : "pointer" }}
          >
            <circle cx={s.pos_x} cy={s.pos_y} r={20} fill="transparent" />
            <circle
              cx={s.pos_x}
              cy={s.pos_y}
              r={s.isInterchange ? 12 : 9}
              fill={getStationColor(s)}
              stroke={getStationStroke(s)}
              strokeWidth={s.isInterchange ? 4 : 3}
            />
            {isInRoute(s.id) && (
              <text
                x={s.pos_x}
                y={s.pos_y + 4}
                textAnchor="middle"
                fontSize="9"
                fontWeight="bold"
                fill="#000"
                style={{ pointerEvents: "none" }}
              >
                {routeIndex(s.id) + 1}
              </text>
            )}
            <text
              x={s.pos_x}
              y={s.pos_y + 24}
              textAnchor="middle"
              fontSize="10"
              fill="#ccc"
              style={{ pointerEvents: "none" }}
            >
              {s.name}
            </text>
            {s.id === origin && (
              <text
                x={s.pos_x}
                y={s.pos_y - 16}
                textAnchor="middle"
                fontSize="9"
                fill="#4CAF50"
                fontWeight="bold"
              >
                PARTENZA
              </text>
            )}
            {s.id === destination && (
              <text
                x={s.pos_x}
                y={s.pos_y - 16}
                textAnchor="middle"
                fontSize="9"
                fill="#F44336"
                fontWeight="bold"
              >
                ARRIVO
              </text>
            )}
          </g>
        ))}
      </svg>

      {showLines && (
        <div
          style={{
            display: "flex",
            gap: "16px",
            justifyContent: "center",
            marginTop: "8px",
            flexWrap: "wrap",
          }}
        >
          {lines.map((l) => (
            <div
              key={l.id}
              style={{ display: "flex", alignItems: "center", gap: "6px" }}
            >
              <span
                style={{
                  width: "16px",
                  height: "4px",
                  background: l.color,
                  borderRadius: "2px",
                }}
              ></span>
              <span style={{ fontSize: "12px", color: "#aaa" }}>{l.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
