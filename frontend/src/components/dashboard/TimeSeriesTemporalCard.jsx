import React from "react";

export default function TimeSeriesTemporalCard({ historyData }) {
  // Benchmark temporal versions v1 to v6 matching image
  const defaultHistory = [
    { version: "v1", accuracy: 88.5, shift_score: 0.12 },
    { version: "v2", accuracy: 87.8, shift_score: 0.14 },
    { version: "v3", accuracy: 85.9, shift_score: 0.13 },
    { version: "v4", accuracy: 89.2, shift_score: 0.19 },
    { version: "v5", accuracy: 88.0, shift_score: 0.22 },
    { version: "v6", accuracy: 86.7, shift_score: 0.26 }
  ];

  const data = historyData && historyData.length > 0 ? historyData : defaultHistory;

  // Chart SVG coordinates
  const svgWidth = 260;
  const svgHeight = 100;
  const paddingX = 20;
  const paddingY = 10;

  // Accuracy scale: 60 to 100
  const minAcc = 60;
  const maxAcc = 100;
  const getAccY = (val) => svgHeight - paddingY - ((val - minAcc) / (maxAcc - minAcc)) * (svgHeight - 2 * paddingY);

  // Shift score scale: 0.0 to 0.4
  const minShift = 0.0;
  const maxShift = 0.4;
  const getShiftY = (val) => svgHeight - paddingY - ((val - minShift) / (maxShift - minShift)) * (svgHeight - 2 * paddingY);

  const getX = (idx) => paddingX + (idx / (data.length - 1)) * (svgWidth - 2 * paddingX);

  // Polyline points
  const accPoints = data.map((d, i) => `${getX(i)},${getAccY(d.accuracy)}`).join(" ");
  const shiftPoints = data.map((d, i) => `${getX(i)},${getShiftY(d.shift_score)}`).join(" ");

  return (
    <div className="dashboard-card">
      <div className="card-header-flex" style={{ marginBottom: "6px" }}>
        <h3 className="card-title">Time Series (Temporal Analysis)</h3>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", alignItems: "center", gap: "14px", fontSize: "11px", color: "#64748b", marginBottom: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <div style={{ width: "12px", height: "2px", backgroundColor: "#2563eb" }}></div>
          <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#2563eb" }}></div>
          <span>Accuracy</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <div style={{ width: "12px", height: "2px", backgroundColor: "#ef4444" }}></div>
          <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#ef4444" }}></div>
          <span>Shift Score</span>
        </div>
      </div>

      {/* Dual Axis SVG Graph */}
      <div style={{ display: "flex", alignItems: "center", height: "130px", position: "relative" }}>
        {/* Left Y Axis (Accuracy) */}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: `${svgHeight}px`, fontSize: "9px", color: "#94a3b8", textAlign: "right", paddingRight: "4px" }}>
          <span>100</span>
          <span>90</span>
          <span>80</span>
          <span>70</span>
          <span>60</span>
        </div>

        {/* SVG Plot */}
        <div style={{ flex: 1, position: "relative" }}>
          <svg width="100%" height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`} style={{ overflow: "visible" }}>
            {/* Grid horizontal lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
              const y = paddingY + pct * (svgHeight - 2 * paddingY);
              return <line key={i} x1={paddingX} y1={y} x2={svgWidth - paddingX} y2={y} stroke="#f1f5f9" strokeWidth="1" />;
            })}

            {/* Accuracy Line (Blue) */}
            <polyline fill="none" stroke="#2563eb" strokeWidth="2" points={accPoints} />
            {data.map((d, i) => (
              <circle key={`acc-${i}`} cx={getX(i)} cy={getAccY(d.accuracy)} r="3" fill="#2563eb" />
            ))}

            {/* Shift Score Line (Red) */}
            <polyline fill="none" stroke="#ef4444" strokeWidth="2" points={shiftPoints} />
            {data.map((d, i) => (
              <circle key={`shift-${i}`} cx={getX(i)} cy={getShiftY(d.shift_score)} r="3" fill="#ef4444" />
            ))}
          </svg>

          {/* X-Axis Version Labels */}
          <div style={{ display: "flex", justifyContent: "space-between", paddingLeft: `${paddingX}px`, paddingRight: `${paddingX}px`, marginTop: "4px", fontSize: "10px", color: "#64748b" }}>
            {data.map((d, i) => (
              <span key={i}>{d.version}</span>
            ))}
          </div>
        </div>

        {/* Right Y Axis (Shift Score) */}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: `${svgHeight}px`, fontSize: "9px", color: "#94a3b8", textAlign: "left", paddingLeft: "4px" }}>
          <span>0.4</span>
          <span>0.3</span>
          <span>0.2</span>
          <span>0.1</span>
          <span>0.0</span>
        </div>
      </div>
    </div>
  );
}
