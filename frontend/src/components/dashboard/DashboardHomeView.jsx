import React from "react";
import { Shield, Bug, Gauge, AlertTriangle, ArrowRight, Calendar } from "lucide-react";
import DefectPredictionOverviewCard from "./DefectPredictionOverviewCard";
import PredictionPerformanceCard from "./PredictionPerformanceCard";
import DatasetShiftAnalysisCard from "./DatasetShiftAnalysisCard";
import ExplainabilityShapCard from "./ExplainabilityShapCard";
import LocalExplanationShapCard from "./LocalExplanationShapCard";
import ReliabilityUncertaintyCard from "./ReliabilityUncertaintyCard";
import CrossProjectComparisonCard from "./CrossProjectComparisonCard";
import TimeSeriesTemporalCard from "./TimeSeriesTemporalCard";
import RecommendationsCard from "./RecommendationsCard";

export default function DashboardHomeView({
  datasets,
  currentModel,
  stats,
  shiftData,
  crossResults,
  historyData,
  latestPrediction,
  onNavigateTab
}) {
  const currentDataset = datasets.find(d => d.name.toLowerCase() === (currentModel?.metadata?.dataset_name || "jm1").toLowerCase()) || datasets[0];

  const totalFiles = stats?.total_predictions || currentDataset?.rows || 1024;
  const defectRate = currentDataset?.defect_rate ? (currentDataset.defect_rate * 100).toFixed(1) : "17.4";
  const predictedDefects = Math.round((totalFiles * parseFloat(defectRate)) / 100);
  const accuracy = currentModel?.metadata?.val_metrics?.accuracy 
    ? (currentModel.metadata.val_metrics.accuracy * 100).toFixed(1) 
    : "86.7";
  const shiftSeverity = shiftData?.results?.overall_shift_severity || "Moderate";

  return (
    <div className="dashboard-content">
      {/* Dashboard Title & Last Updated Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-heading">DefectLens Dashboard</h1>
          <div className="dashboard-subheading">
            Comprehensive view of defect prediction, explanations, data shifts and reliability.
          </div>
        </div>
        <div className="last-updated-text">
          <Calendar size={15} />
          <span>Last Updated: Apr 25, 2025 10:42 AM</span>
        </div>
      </div>

      {/* Top 4 Metric Cards */}
      <div className="metric-cards-grid">
        {/* Card 1: Total Files */}
        <div className="metric-card">
          <div className="metric-card-top">
            <div className="icon-circle-badge" style={{ backgroundColor: "#fee2e2" }}>
              <Shield size={20} color="#ef4444" />
            </div>
            <div>
              <div className="metric-title">Total Files</div>
              <div className="metric-number">
                {totalFiles.toLocaleString()}
              </div>
            </div>
          </div>
          <div className="metric-footer">
            <span className="trend-badge trend-green">
              &uarr; 12%
            </span>
            <span className="trend-gray">vs. previous run</span>
          </div>
        </div>

        {/* Card 2: Predicted Defects */}
        <div className="metric-card">
          <div className="metric-card-top">
            <div className="icon-circle-badge" style={{ backgroundColor: "#dcfce7" }}>
              <Bug size={20} color="#10b981" />
            </div>
            <div>
              <div className="metric-title">Predicted Defects</div>
              <div className="metric-number">
                {predictedDefects}
              </div>
            </div>
          </div>
          <div className="metric-footer" style={{ justifyContent: "space-between" }}>
            <span style={{ fontSize: "11px", color: "#64748b" }}>{defectRate}% of total</span>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span className="trend-badge trend-green">&uarr; 8%</span>
              <span className="trend-gray" style={{ fontSize: "10px" }}>vs. previous run</span>
            </div>
          </div>
        </div>

        {/* Card 3: Model Accuracy */}
        <div className="metric-card">
          <div className="metric-card-top">
            <div className="icon-circle-badge" style={{ backgroundColor: "#e0f2fe" }}>
              <Gauge size={20} color="#0284c7" />
            </div>
            <div>
              <div className="metric-title">Model Accuracy</div>
              <div className="metric-number">
                {accuracy}%
              </div>
            </div>
          </div>
          <div className="metric-footer">
            <span className="trend-badge trend-green">
              &uarr; 2.3%
            </span>
            <span className="trend-gray">vs. previous run</span>
          </div>
        </div>

        {/* Card 4: Dataset Shift Status */}
        <div className="metric-card" style={{ cursor: "pointer" }} onClick={() => onNavigateTab("shift")}>
          <div className="metric-card-top">
            <div className="icon-circle-badge" style={{ backgroundColor: "#ede9fe" }}>
              <AlertTriangle size={20} color="#7c3aed" />
            </div>
            <div>
              <div className="metric-title">Dataset Shift Status</div>
              <div className="metric-number" style={{ fontSize: "24px" }}>
                Detected
              </div>
            </div>
          </div>
          <div className="metric-footer" style={{ justifyContent: "space-between" }}>
            <span style={{ color: "#64748b", fontWeight: "500" }}>{shiftSeverity} Shift</span>
            <ArrowRight size={14} color="#64748b" />
          </div>
        </div>
      </div>

      {/* Grid Row 1: Defect Overview, Performance, Shift Analysis */}
      <div className="dashboard-row-grid">
        <DefectPredictionOverviewCard stats={stats} currentDataset={currentDataset} />
        <PredictionPerformanceCard currentModel={currentModel} />
        <DatasetShiftAnalysisCard shiftResults={shiftData?.results} onSelectTab={() => onNavigateTab("shift")} />
      </div>

      {/* Grid Row 2: Explainability SHAP, Local Explanation, Reliability & Uncertainty */}
      <div className="dashboard-row-grid">
        <ExplainabilityShapCard featureImportance={currentModel?.metadata?.feature_importance} />
        <LocalExplanationShapCard latestPrediction={latestPrediction} onToggleLime={() => onNavigateTab("predict")} />
        <ReliabilityUncertaintyCard reliabilityData={latestPrediction?.reliability} onDetailedClick={() => onNavigateTab("predict")} />
      </div>

      {/* Grid Row 3: Cross-Project, Time Series, Recommendations */}
      <div className="dashboard-row-grid">
        <CrossProjectComparisonCard crossResults={crossResults} />
        <TimeSeriesTemporalCard historyData={historyData} />
        <RecommendationsCard onDownloadClick={() => onNavigateTab("reports")} />
      </div>
    </div>
  );
}
