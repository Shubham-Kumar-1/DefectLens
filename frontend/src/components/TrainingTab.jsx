import React, { useState } from "react";
import { Cpu, Sliders, RefreshCw, BarChart3, Database } from "lucide-react";
import { api } from "../services/api";

export default function TrainingTab({ datasets, currentModel, onModelTrained }) {
  const [selectedDataset, setSelectedDataset] = useState(currentModel?.metadata?.dataset_name || "jm1");
  const [selectedAlgorithm, setSelectedAlgorithm] = useState(currentModel?.metadata?.algorithm || "random_forest");
  const [calibrate, setCalibrate] = useState(true);
  const [isTraining, setIsTraining] = useState(false);
  const [trainStatus, setTrainStatus] = useState(null);

  const handleTrain = async () => {
    setIsTraining(true);
    setTrainStatus(null);
    try {
      const res = await api.trainModel({
        dataset_name: selectedDataset,
        algorithm: selectedAlgorithm,
        calibrate: calibrate
      });
      if (res.status === "SUCCESS") {
        setTrainStatus({ type: "success", message: res.message });
        onModelTrained(res.metadata);
      } else {
        setTrainStatus({ type: "error", message: res.detail || "Training failed" });
      }
    } catch (e) {
      setTrainStatus({ type: "error", message: e.message });
    } finally {
      setIsTraining(false);
    }
  };

  const meta = currentModel?.metadata || {};
  const metrics = meta.val_metrics || {};
  const cm = metrics.confusion_matrix || {};
  const rankings = meta.feature_rankings || [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Configuration Header */}
      <div className="glass-card" style={{ padding: "24px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
          <Sliders size={20} color="#3b82f6" /> Model Training &amp; Calibration Suite
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", alignItems: "flex-end" }}>
          <div>
            <label style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: "600", display: "block", marginBottom: "6px" }}>
              TRAINING BENCHMARK DATASET
            </label>
            <select
              className="input-field"
              value={selectedDataset}
              onChange={(e) => setSelectedDataset(e.target.value)}
            >
              {datasets.map((d) => (
                <option key={d.name} value={d.name.toLowerCase()}>
                  {d.name} ({d.rows} modules, {Math.round(d.defect_rate * 100)}% defects)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: "600", display: "block", marginBottom: "6px" }}>
              CLASSIFICATION ALGORITHM
            </label>
            <select
              className="input-field"
              value={selectedAlgorithm}
              onChange={(e) => setSelectedAlgorithm(e.target.value)}
            >
              <option value="random_forest">Random Forest Classifier (Ensemble)</option>
              <option value="xgboost">XGBoost (Gradient Boosted Trees)</option>
              <option value="logistic_regression">Logistic Regression (L2 Regularized)</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: "600", display: "block", marginBottom: "6px" }}>
              PROBABILITY CALIBRATION
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", cursor: "pointer", height: "38px" }}>
              <input
                type="checkbox"
                checked={calibrate}
                onChange={(e) => setCalibrate(e.target.checked)}
                style={{ width: "16px", height: "16px", accentColor: "#3b82f6" }}
              />
              <span>Apply Sigmoid Calibration</span>
            </label>
          </div>

          <div>
            <button
              onClick={handleTrain}
              disabled={isTraining}
              className="btn btn-primary"
              style={{ width: "100%", height: "38px" }}
            >
              {isTraining ? <RefreshCw className="animate-spin" size={16} /> : <Cpu size={16} />}
              {isTraining ? "Training & Calibrating..." : "Train Model"}
            </button>
          </div>
        </div>

        {trainStatus && (
          <div style={{ marginTop: "16px", padding: "12px", borderRadius: "8px", background: trainStatus.type === "success" ? "rgba(16,185,129,0.1)" : "rgba(244,63,94,0.1)", border: `1px solid ${trainStatus.type === "success" ? "rgba(16,185,129,0.3)" : "rgba(244,63,94,0.3)"}`, color: trainStatus.type === "success" ? "#34d399" : "#fb7185", fontSize: "13px" }}>
            {trainStatus.message}
          </div>
        )}
      </div>

      {/* Metrics Section */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px" }}>
        {/* Validation Scorecard */}
        <div className="glass-card" style={{ padding: "24px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <BarChart3 size={18} color="#06b6d4" /> In-Domain Validation Metrics
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
            <div style={{ background: "rgba(255,255,255,0.02)", padding: "12px", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
              <div style={{ fontSize: "11px", color: "var(--text-secondary)", textTransform: "uppercase" }}>F1-Score</div>
              <div style={{ fontSize: "22px", fontWeight: "700", color: "#3b82f6" }}>{metrics.f1_score ?? "-"}</div>
            </div>
            <div style={{ background: "rgba(255,255,255,0.02)", padding: "12px", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
              <div style={{ fontSize: "11px", color: "var(--text-secondary)", textTransform: "uppercase" }}>PR-AUC</div>
              <div style={{ fontSize: "22px", fontWeight: "700", color: "#06b6d4" }}>{metrics.pr_auc ?? "-"}</div>
            </div>
            <div style={{ background: "rgba(255,255,255,0.02)", padding: "12px", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
              <div style={{ fontSize: "11px", color: "var(--text-secondary)", textTransform: "uppercase" }}>Defect Recall</div>
              <div style={{ fontSize: "22px", fontWeight: "700", color: "#f59e0b" }}>{metrics.recall ?? "-"}</div>
            </div>
            <div style={{ background: "rgba(255,255,255,0.02)", padding: "12px", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
              <div style={{ fontSize: "11px", color: "var(--text-secondary)", textTransform: "uppercase" }}>Brier Score</div>
              <div style={{ fontSize: "22px", fontWeight: "700", color: "#a855f7" }}>{metrics.brier_score ?? "-"}</div>
            </div>
          </div>

          <div style={{ fontSize: "12px", color: "var(--text-muted)", background: "rgba(59,130,246,0.05)", padding: "10px", borderRadius: "6px", border: "1px solid rgba(59,130,246,0.15)" }}>
            <strong>Academic Note:</strong> Accuracy is deceptive in imbalanced defect datasets (where defects typically represent 10-25%). We prioritize <strong>Recall</strong> &amp; <strong>PR-AUC</strong> because missing a defective module is significantly more costly than an extra manual inspection.
          </div>

          <h4 style={{ fontSize: "13px", fontWeight: "600", marginTop: "20px", marginBottom: "8px" }}>Confusion Matrix</h4>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", textAlign: "center" }}>
            <div style={{ padding: "10px", borderRadius: "6px", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)" }}>
              <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>True Clean (TN)</div>
              <div style={{ fontSize: "18px", fontWeight: "700", color: "#34d399" }}>{cm.true_negatives ?? 0}</div>
            </div>
            <div style={{ padding: "10px", borderRadius: "6px", background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.2)" }}>
              <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>False Alarm (FP)</div>
              <div style={{ fontSize: "18px", fontWeight: "700", color: "#fb7185" }}>{cm.false_positives ?? 0}</div>
            </div>
            <div style={{ padding: "10px", borderRadius: "6px", background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)" }}>
              <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>Missed Defect (FN)</div>
              <div style={{ fontSize: "18px", fontWeight: "700", color: "#ef4444" }}>{cm.false_negatives ?? 0}</div>
            </div>
            <div style={{ padding: "10px", borderRadius: "6px", background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.3)" }}>
              <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>Detected Defect (TP)</div>
              <div style={{ fontSize: "18px", fontWeight: "700", color: "#60a5fa" }}>{cm.true_positives ?? 0}</div>
            </div>
          </div>
        </div>

        {/* Feature Selection & Information Theory Rankings */}
        <div className="glass-card" style={{ padding: "24px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Database size={18} color="#10b981" /> Feature Importance &amp; Mutual Information
          </h3>

          <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "14px" }}>
            Combines non-linear Mutual Information $I(X; Y)$ with Pearson correlation to rank metrics driving defect propensity.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "360px", overflowY: "auto", paddingRight: "4px" }}>
            {rankings.slice(0, 10).map((r, idx) => (
              <div key={r.feature} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", borderRadius: "6px", background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-subtle)", fontSize: "13px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ color: "var(--text-muted)", fontSize: "11px", width: "16px" }}>#{idx + 1}</span>
                  <span style={{ fontWeight: "600", fontFamily: "var(--font-mono)" }}>{r.feature}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>MI: {r.mutual_info}</span>
                  <div style={{ width: "70px", height: "6px", background: "rgba(255,255,255,0.1)", borderRadius: "3px", overflow: "hidden" }}>
                    <div style={{ width: `${Math.min(100, r.combined_rank_score * 200)}%`, height: "100%", background: "#10b981" }}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
