import { useMemo } from "react";

export default function SegmentList({
  segments,
  stations,
  route,
  origin,
  onSelectSegment,
}) {
  const stationMap = useMemo(() => {
    const map = {};
    stations.forEach((s) => (map[s.id] = s));
    return map;
  }, [stations]);

  const lastStation = route.length > 0 ? route[route.length - 1] : null;

  const isSelectable = (seg) => {
    if (route.length === 0) {
      return seg.a === origin || seg.b === origin;
    }
    return seg.a === lastStation || seg.b === lastStation;
  };

  const handleClick = (seg) => {
    if (!isSelectable(seg)) return;
    let newStation;
    if (route.length === 0) {
      if (seg.a === origin) newStation = seg.b;
      else if (seg.b === origin) newStation = seg.a;
      else return;
    } else {
      if (seg.a === lastStation) newStation = seg.b;
      else if (seg.b === lastStation) newStation = seg.a;
      else return;
    }
    onSelectSegment(newStation);
  };

  return (
    <div className="segment-list">
      {segments.map((seg, idx) => {
        const aName = stationMap[seg.a]?.name || seg.a;
        const bName = stationMap[seg.b]?.name || seg.b;
        const selectable = isSelectable(seg);
        return (
          <div
            key={idx}
            className={`segment-item ${selectable ? "selectable" : ""}`}
            onClick={() => handleClick(seg)}
          >
            {aName} — {bName}
          </div>
        );
      })}
    </div>
  );
}
