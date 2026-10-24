import React from "react";

export default function DefectPredictionOverviewCard({ stats, currentDataset }) {
  // Use real dataset stats if available, or benchmark proportions
  const total = stats?.total_predictions || currentDataset?.rows || 1024;
  const defectRate = currentDataset?.defect_rate ? (currentDataset.defect_rate * 100) : 17.4;
  const defectiveCount = Math.round((total * defectRate) / 100);
  const cleanCount = total - defectiveCount;
  const cleanRate = (100 - defectRate).toFixed(1);

  // SVG Donut calculation
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const defectOffset = circumference * (1 - defectRate / 100);

  return (
    <div className="dashboard-card">
      <div className="card-header-flex">
        <h3 className="card-title">Defect Prediction Overview</h3>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: "100%", padding: "10px 0" }}>
        {/* Donut Chart SVG */}
        <div style={{ position: "relative", width: "150px", height: "150px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="150" height="150" viewBox="0 0 150 150">
            {/* Background Ring (Non-Defective - Green) */}
            <circle
              cx="75"
              cy="75"
              r={radius}
              fill="transparent"
              stroke="#10b981"
              strokeWidth="20"
            />
            {/* Foreground Arc (Defective - Red) */}
            <circle
              cx="75"
              cy="75"
              r={radius}
              fill="transparent"
              stroke="#ef4444"
              strokeWidth="20"
              strokeDasharray={circumference}
              strokeDashoffset={defectOffset}
              strokeLinecap="butt"
              transform="rotate(-90 75 75)"
            />
          </svg>

          {/* Centered Percentage Text */}
          <div style={{ position: "absolute", textAlign: "center" }}>
            <div style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a" }}>
              {defectRate.toFixed(1)}%
            </div>
            <div style={{ fontSize: "11px", color: "#64748b", marginTop: "-2px" }}>
              Defective
            </div>
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px", flex: 1, paddingLeft: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{ width: "9px", height: "9px", borderRadius: "50%", backgroundColor: "#ef4444" }}></div>
              <span style={{ color: "#334155", fontWeight: "500" }}>Defective ({defectiveCount})</span>
            </div>
            <strong style={{ color: "#0f172a", fontWeight: "600" }}>{defectRate.toFixed(1)}%</strong>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{ width: "9px", height: "9px", borderRadius: "50%", backgroundColor: "#10b981" }}></div>
              <span style={{ color: "#334155", fontWeight: "500" }}>Non-Defective ({cleanCount})</span>
            </div>
            <strong style={{ color: "#0f172a", fontWeight: "600" }}>{cleanRate}%</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
