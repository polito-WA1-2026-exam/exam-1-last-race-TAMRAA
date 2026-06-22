export default function RouteBuilder({
  route,
  stations,
  onUndo,
  onClear,
  onConfirm,
  isValid, 
}) {
  const stationLookup = {};
  stations.forEach((s) => (stationLookup[s.id] = s));

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "8px",
        }}
      >
        <span className="card-title">Il Tuo Percorso</span>
        <div style={{ display: "flex", gap: "6px" }}>
          <button
            className="btn btn-secondary"
            onClick={onUndo}
            disabled={route.length <= 1}
          >
            Cancel
          </button>
          <button
            className="btn btn-danger"
            onClick={onClear}
            disabled={route.length <= 1}
          >
            Reset
          </button>
        </div>
      </div>

      <div className="route-stations">
        {route.length === 0 ? (
          <span className="route-empty">
            Select a segment from the list to start building your route.
          </span>
        ) : (
          route.map((id, idx) => {
            const s = stationLookup[id];
            const isLast = idx === route.length - 1;
            return (
              <span
                key={idx}
                style={{ display: "flex", alignItems: "center", gap: "4px" }}
              >
                <span className="route-step">
                  <span className="num">{idx + 1}</span>
                  {s ? s.name : id}
                </span>
                {!isLast && <span className="route-arrow">→</span>}
              </span>
            );
          })
        )}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: "12px",
        }}
      >
        <div style={{ fontSize: "13px", color: "#888" }}>
          Station: {route.length}
          {route.length > 1 && (
            <span style={{ marginLeft: "12px" }}>
              Change: {Math.max(0, route.length - 2)}
            </span>
          )}
        </div>
        <button
          className="btn btn-success"
          onClick={onConfirm}
          // Always enabled – we removed disabled={!isValid}
        >
          Confirm Path
        </button>
      </div>
    </div>
  );
}
