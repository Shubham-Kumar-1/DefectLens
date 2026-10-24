import React from "react";
import { Download, Lightbulb } from "lucide-react";
import { api } from "../../services/api";

export default function RecommendationsCard({ onDownloadClick }) {
  const recommendations = [
    "Investigate features with high shift (CBO, RFC).",
    "Review samples with high uncertainty.",
    "Consider model retraining with updated data.",
    "Monitor shift trends in next releases."
  ];

  const handleDownload = () => {
    if (onDownloadClick) {
      onDownloadClick();
    } else {
      window.open(api.getExportHtmlUrl(), "_blank");
    }
  };

  return (
    <div className="dashboard-card" style={{ justifyContent: "space-between" }}>
      <div>
        <div className="card-header-flex" style={{ marginBottom: "10px" }}>
          <h3 className="card-title">Recommendations</h3>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: "700", color: "#10b981", marginBottom: "8px" }}>
          <Lightbulb size={14} /> Recommended Actions
        </div>

        <div className="recommendation-list">
          {recommendations.map((text, idx) => (
            <div key={idx} className="recommendation-item">
              <div className="recom-num">{idx + 1}</div>
              <div>{text}</div>
            </div>
          ))}
        </div>
      </div>

      <button onClick={handleDownload} className="btn-download-report">
        <Download size={15} /> Download Report
      </button>
    </div>
  );
}
