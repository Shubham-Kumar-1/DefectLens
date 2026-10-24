import React, { useState } from "react";

export default function LocalExplanationShapCard({ latestPrediction, onToggleLime }) {
  const [showLime, setShowLime] = useState(false);

  // Default waterfall values matching image
  const defaultWaterfall = [
    { feature: "CBO", value: 0.21, isPositive: true },
    { feature: "RFC", value: 0.17, isPositive: true },
    { feature: "LOC", value: 0.10, isPositive: true },
    { feature: "WMC", value: -0.08, isPositive: false },
    { feature: "DIT", value: -0.05, isPositive: false }
  ];

  const shap = latestPrediction?.shap_explanation;
  const items = shap?.all_contributions ? shap.all_contributions.slice(0, 5).map(c => ({
    feature: c.feature.toUpperCase(),
    value: c.contribution,
    isPositive: c.contribution >= 0
  })) : defaultWaterfall;

  const prob = latestPrediction?.probability ? latestPrediction.probability.toFixed(2) : "0.87";
  const predLabel = latestPrediction?.prediction || "Defective";

  return (
    <div className="dashboard-card">
      <div className="card-header-flex" style={{ marginBottom: "6px" }}>
        <div>
          <h3 className="card-title">Local Explanation (SHAP)</h3>
          <div style={{ fontSize: "11px", fontWeight: "700", color: "#ef4444", marginTop: "2px" }}>
            Prediction: {predLabel} ({prob})
          </div>
        </div>

        <button
          onClick={() => {
            setShowLime(!showLime);
            if (onToggleLime) onToggleLime();
          }}
          style={{
            border: "1px solid #d1d5db",
            borderRadius: "6px",
            backgroundColor: showLime ? "#f1f5f9" : "#ffffff",
            padding: "4px 10px",
            fontSize: "11px",
            fontWeight: "600",
            color: "#334155",
            cursor: "pointer"
          }}
        >
          {showLime ? "View SHAP" : "View LIME"}
        </button>
      </div>

      {/* Waterfall Visualization */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1, justifyContent: "space-around", marginTop: "6px" }}>
        {items.map((item, idx) => {
          const widthPx = Math.min(65, Math.abs(item.value) * 260);

          return (
            <div key={idx} style={{ display: "flex", alignItems: "center", fontSize: "11px" }}>
              <span style={{ width: "38px", fontWeight: "600", color: "#334155" }}>
                {item.feature}
              </span>

              {/* Center aligned track */}
              <div style={{ flex: 1, display: "flex", alignItems: "center", height: "18px", position: "relative" }}>
                {/* Center baseline divider line */}
                <div style={{ position: "absolute", left: "45%", top: 0, bottom: 0, width: "1px", backgroundColor: "#e2e8f0", zIndex: 1 }}></div>

                {/* Left side (negative protective contribution) */}
                <div style={{ width: "45%", display: "flex", justifyContent: "flex-end", alignItems: "center", paddingRight: "4px" }}>
                  {!item.isPositive && (
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <span style={{ fontSize: "10px", fontWeight: "600", color: "#10b981" }}>
                        {item.value.toFixed(2)}
                      </span>
                      <div
                        style={{
                          width: `${widthPx}px`,
                          height: "12px",
                          backgroundColor: "#10b981",
                          borderRadius: "2px"
                        }}
                      ></div>
                    </div>
                  )}
                </div>

                {/* Right side (positive risk contribution) */}
                <div style={{ width: "55%", display: "flex", justifyContent: "flex-start", alignItems: "center", paddingLeft: "4px" }}>
                  {item.isPositive && (
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <div
                        style={{
                          width: `${widthPx}px`,
                          height: "12px",
                          backgroundColor: "#ef4444",
                          borderRadius: "2px"
                        }}
                      ></div>
                      <span style={{ fontSize: "10px", fontWeight: "600", color: "#ef4444" }}>
                        +{item.value.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Axis Footer */}
      <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "6px", marginTop: "4px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#94a3b8", paddingLeft: "38px" }}>
          <span>0.0</span>
          <span>{prob}</span>
        </div>
        <div style={{ textAlign: "center", fontSize: "10px", color: "#94a3b8", marginTop: "2px" }}>
          &larr; Higher risk &rarr;
        </div>
      </div>
    </div>
  );
}
