import React from "react";
import { AlertTriangle } from "lucide-react";

export default function ReliabilityUncertaintyCard({ reliabilityData, onDetailedClick }) {
  const oodScore = reliabilityData?.ood_result?.mahalanobis_distance 
    ? (reliabilityData.ood_result.mahalanobis_distance / 100).toFixed(2) 
    : "0.21";
  const ece = "0.12";
  const uncertainty = "0.32";

  return (
    <div className="dashboard-card">
      <div className="card-header-flex" style={{ marginBottom: "12px" }}>
        <h3 className="card-title">Reliability &amp; Uncertainty</h3>
      </div>

      {/* Red Alert Box */}
      <div style={{
        backgroundColor: "#fef2f2",
        border: "1px solid #fee2e2",
        borderRadius: "8px",
        padding: "10px 12px",
        display: "flex",
        alignItems: "flex-start",
        gap: "10px",
        marginBottom: "14px"
      }}>
        <div style={{
          width: "20px",
          height: "20px",
          borderRadius: "50%",
          backgroundColor: "#ef4444",
          color: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          marginTop: "1px"
        }}>
          <AlertTriangle size={12} />
        </div>
        <div>
          <div style={{ fontSize: "12px", fontWeight: "700", color: "#991b1b" }}>
            Model Reliability: Low
          </div>
          <div style={{ fontSize: "11px", color: "#b91c1c", marginTop: "2px", lineHeight: "1.3" }}>
            Due to detected dataset shift and increased uncertainty.
          </div>
        </div>
      </div>

      {/* Metrics Bars */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px", flex: 1, justifyContent: "space-around" }}>
        {/* Prediction Uncertainty */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
            <span>Prediction Uncertainty</span>
            <span style={{ color: "#0f172a" }}>{uncertainty}</span>
          </div>
          <div style={{ height: "6px", backgroundColor: "#f1f5f9", borderRadius: "3px", overflow: "hidden" }}>
            <div style={{ width: "32%", height: "100%", backgroundColor: "#334155" }}></div>
          </div>
        </div>

        {/* Calibration Error (ECE) */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
            <span>Calibration Error (ECE)</span>
            <span style={{ color: "#0f172a" }}>{ece}</span>
          </div>
          <div style={{ height: "6px", backgroundColor: "#f1f5f9", borderRadius: "3px", overflow: "hidden" }}>
            <div style={{ width: "24%", height: "100%", backgroundColor: "#06b6d4" }}></div>
          </div>
        </div>

        {/* OOD Score (Mahalanobis) */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", fontWeight: "600", color: "#334155", marginBottom: "4px" }}>
            <span>OOD Score (Mahalanobis)</span>
            <span style={{ color: "#0f172a" }}>{oodScore}</span>
          </div>
          <div style={{ height: "6px", backgroundColor: "#f1f5f9", borderRadius: "3px", overflow: "hidden" }}>
            <div style={{ width: "42%", height: "100%", backgroundColor: "#f59e0b" }}></div>
          </div>
        </div>
      </div>

      {/* Button */}
      <button
        onClick={onDetailedClick}
        style={{
          width: "100%",
          padding: "8px 12px",
          backgroundColor: "#ffffff",
          border: "1px solid #d1d5db",
          borderRadius: "6px",
          fontSize: "12px",
          fontWeight: "600",
          color: "#2563eb",
          cursor: "pointer",
          textAlign: "center"
        }}
      >
        View Detailed Analysis
      </button>
    </div>
  );
}
