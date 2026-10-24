import React, { useState, useEffect, useCallback } from "react";
import { SlidersHorizontal, ArrowRight } from "lucide-react";
import { api } from "../services/api";

const INITIAL_BASE_FEATURES = {
  loc: 240.0,
  v_g: 18.0,
  ev_g: 9.0,
  iv_g: 12.0,
  n: 480.0,
  v: 3100.0,
  l: 0.04,
  d: 25.0,
  i: 124.0,
  e: 77500.0,
  b: 1.03,
  t: 4305.0,
  lOCode: 190.0,
  lOComment: 25.0,
  lOBlank: 25.0,
  locCodeAndComment: 5.0,
  uniq_Op: 26.0,
  uniq_Opnd: 42.0,
  total_Op: 280.0,
  total_Opnd: 200.0,
  branchCount: 35.0
};

export default function WhatIfTab() {
  const [baseFeatures] = useState(INITIAL_BASE_FEATURES);

  const [modifiedFeatures, setModifiedFeatures] = useState({
    ...INITIAL_BASE_FEATURES,
    loc: 95.0,
    v_g: 6.0,
    iv_g: 4.0,
    e: 18000.0,
    branchCount: 11.0
  });

  const [simulationResult, setSimulationResult] = useState(null);
  const [_loading, setLoading] = useState(false);

  const runSimulation = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.simulateWhatIf({
        base_features: baseFeatures,
        modified_features: modifiedFeatures
      });
      setSimulationResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [baseFeatures, modifiedFeatures]);

  useEffect(() => {
    runSimulation();
  }, [runSimulation]);

  const handleSliderChange = (key, val) => {
    setModifiedFeatures(prev => ({ ...prev, [key]: parseFloat(val) }));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div className="glass-card" style={{ padding: "24px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px" }}>
          <SlidersHorizontal size={20} color="#8b5cf6" /> What-If Counterfactual Refactoring Simulator
        </h2>
        <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "4px" }}>
          Interactive sensitivity simulation: Tweak software complexity and size metrics to estimate how planned code refactorings impact model defect risk.
        </p>
      </div>

      {/* Interactive Controls & Outcome Card */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px" }}>
        {/* Sliders Form */}
        <div className="glass-card" style={{ padding: "24px" }}>
          <h3 style={{ fontSize: "15px", fontWeight: "700", marginBottom: "16px" }}>
            Hypothetical Refactoring Controls
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            {/* LOC Slider */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "6px" }}>
                <span style={{ fontWeight: "600" }}>Lines of Code (LOC)</span>
                <span style={{ color: "#3b82f6", fontWeight: "700" }}>{modifiedFeatures.loc} (Original: {baseFeatures.loc})</span>
              </div>
              <input
                type="range"
                min="10"
                max="500"
                step="5"
                value={modifiedFeatures.loc}
                onChange={(e) => handleSliderChange("loc", e.target.value)}
                style={{ width: "100%", accentColor: "#3b82f6" }}
              />
            </div>

            {/* Cyclomatic Complexity Slider */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "6px" }}>
                <span style={{ fontWeight: "600" }}>Cyclomatic Complexity v(g)</span>
                <span style={{ color: "#8b5cf6", fontWeight: "700" }}>{modifiedFeatures.v_g} (Original: {baseFeatures.v_g})</span>
              </div>
              <input
                type="range"
                min="1"
                max="50"
                step="1"
                value={modifiedFeatures.v_g}
                onChange={(e) => handleSliderChange("v_g", e.target.value)}
                style={{ width: "100%", accentColor: "#8b5cf6" }}
              />
            </div>

            {/* Design Complexity Slider */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "6px" }}>
                <span style={{ fontWeight: "600" }}>Design Complexity iv(g)</span>
                <span style={{ color: "#06b6d4", fontWeight: "700" }}>{modifiedFeatures.iv_g} (Original: {baseFeatures.iv_g})</span>
              </div>
              <input
                type="range"
                min="1"
                max="30"
                step="1"
                value={modifiedFeatures.iv_g}
                onChange={(e) => handleSliderChange("iv_g", e.target.value)}
                style={{ width: "100%", accentColor: "#06b6d4" }}
              />
            </div>

            {/* Halstead Effort Slider */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "6px" }}>
                <span style={{ fontWeight: "600" }}>Halstead Effort (e)</span>
                <span style={{ color: "#f59e0b", fontWeight: "700" }}>{Math.round(modifiedFeatures.e)} (Original: {baseFeatures.e})</span>
              </div>
              <input
                type="range"
                min="500"
                max="150000"
                step="1000"
                value={modifiedFeatures.e}
                onChange={(e) => handleSliderChange("e", e.target.value)}
                style={{ width: "100%", accentColor: "#f59e0b" }}
              />
            </div>

            <button onClick={runSimulation} disabled={loading} className="btn btn-primary" style={{ marginTop: "10px" }}>
              {loading ? "Simulating Refactoring Impact..." : "Re-calculate Defect Sensitivity"}
            </button>
          </div>
        </div>

        {/* Counterfactual Simulation Comparison */}
        {simulationResult && (
          <div className="glass-card" style={{ padding: "24px" }}>
            <h3 style={{ fontSize: "15px", fontWeight: "700", marginBottom: "16px" }}>
              Estimated Defect Risk Delta
            </h3>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-around", padding: "20px", background: "rgba(255,255,255,0.02)", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
              {/* Original */}
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "12px", color: "var(--text-secondary)", textTransform: "uppercase" }}>Original Code</div>
                <div style={{ fontSize: "36px", fontWeight: "800", color: "#f43f5e", marginTop: "4px" }}>
                  {(simulationResult.original_probability * 100).toFixed(1)}%
                </div>
                <span className="badge badge-rose">High Risk</span>
              </div>

              <ArrowRight size={28} color="var(--text-muted)" />

              {/* After */}
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "12px", color: "var(--text-secondary)", textTransform: "uppercase" }}>After Refactoring</div>
                <div style={{ fontSize: "36px", fontWeight: "800", color: simulationResult.modified_probability < 0.5 ? "#10b981" : "#f59e0b", marginTop: "4px" }}>
                  {(simulationResult.modified_probability * 100).toFixed(1)}%
                </div>
                <span className={`badge badge-${simulationResult.modified_probability < 0.5 ? "emerald" : "amber"}`}>
                  {simulationResult.modified_probability < 0.5 ? "Clean / Controlled" : "Moderate Risk"}
                </span>
              </div>
            </div>

            <div style={{ marginTop: "20px", padding: "12px", borderRadius: "8px", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "13px", fontWeight: "600", color: "#34d399" }}>Net Defect Risk Reduction:</span>
              <strong style={{ fontSize: "18px", color: "#34d399" }}>
                {simulationResult.delta_percentage_points}% points
              </strong>
            </div>

            <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "16px", background: "rgba(255,255,255,0.02)", padding: "10px", borderRadius: "6px" }}>
              <strong>Scientific Disclaimer:</strong> {simulationResult.disclaimer}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
