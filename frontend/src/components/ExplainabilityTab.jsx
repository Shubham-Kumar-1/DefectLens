import React, { useState, useEffect, useMemo } from "react";
import {
  AlertTriangle,
  Lightbulb,
  ChevronDown,
  RefreshCw,
  Info,
  CheckCircle
} from "lucide-react";
import { api } from "../services/api";

const PRESETS = {
  highRisk: {
    name: "PaymentProcessor (High Defect Risk - 0.87)",
    predicted_result: "High Defect Risk",
    probability: 0.87,
    base_value: 0.12,
    top_contributing: [
      { feature: "v_g", label: "Cyclomatic Complexity", contribution: 0.31, impact: "High", bar_pct: 85 },
      { feature: "e", label: "Code Churn", contribution: 0.24, impact: "High", bar_pct: 66 },
      { feature: "loc", label: "Lines of Code (LOC)", contribution: 0.17, impact: "Medium", bar_pct: 46 },
      { feature: "branchCount", label: "Coupling", contribution: 0.11, impact: "Medium", bar_pct: 30 },
      { feature: "iv_g", label: "Number of Methods", contribution: 0.08, impact: "Low", bar_pct: 22 }
    ],
    takeaway: "The model predicts a high defect risk mainly due to high complexity, frequent changes and large code size."
  },
  moderateRisk: {
    name: "UserAuthService (Borderline Risk - 0.52)",
    predicted_result: "Moderate Defect Risk",
    probability: 0.52,
    base_value: 0.12,
    top_contributing: [
      { feature: "v_g", label: "Cyclomatic Complexity", contribution: 0.19, impact: "Medium", bar_pct: 52 },
      { feature: "loc", label: "Lines of Code (LOC)", contribution: 0.14, impact: "Medium", bar_pct: 38 },
      { feature: "e", label: "Code Churn", contribution: 0.09, impact: "Low", bar_pct: 25 },
      { feature: "branchCount", label: "Coupling", contribution: 0.05, impact: "Low", bar_pct: 14 },
      { feature: "iv_g", label: "Number of Methods", contribution: -0.07, impact: "Low", bar_pct: 18 }
    ],
    takeaway: "The model predicts a moderate risk with borderline complexity; modular refactoring can stabilize this module."
  },
  cleanModule: {
    name: "StringUtility (Low Defect Risk - 0.09)",
    predicted_result: "Low Defect Risk",
    probability: 0.09,
    base_value: 0.12,
    top_contributing: [
      { feature: "loc", label: "Lines of Code (LOC)", contribution: -0.06, impact: "Low", bar_pct: 16 },
      { feature: "v_g", label: "Cyclomatic Complexity", contribution: -0.04, impact: "Low", bar_pct: 11 },
      { feature: "e", label: "Code Churn", contribution: 0.03, impact: "Low", bar_pct: 8 },
      { feature: "branchCount", label: "Coupling", contribution: 0.02, impact: "Low", bar_pct: 5 },
      { feature: "iv_g", label: "Number of Methods", contribution: 0.02, impact: "Low", bar_pct: 5 }
    ],
    takeaway: "The model predicts a clean module with low defect risk, as code structure is clean and modular."
  }
};

const DEFAULT_SHAP_GLOBAL = [
  { label: "Cyclomatic Complexity", importance: 0.28 },
  { label: "Code Churn", importance: 0.22 },
  { label: "LOC", importance: 0.18 },
  { label: "Coupling", importance: 0.14 },
  { label: "Number of Methods", importance: 0.09 },
  { label: "Fan-in", importance: 0.05 },
  { label: "Fan-out", importance: 0.04 },
  { label: "Inheritance", importance: 0.03 }
];

const DEFAULT_LIME_GLOBAL = [
  { label: "Cyclomatic Complexity", importance: 0.26 },
  { label: "LOC", importance: 0.24 },
  { label: "Code Churn", importance: 0.19 },
  { label: "Coupling", importance: 0.13 },
  { label: "Number of Methods", importance: 0.08 },
  { label: "Fan-in", importance: 0.05 },
  { label: "Fan-out", importance: 0.03 },
  { label: "Inheritance", importance: 0.02 }
];

export default function ExplainabilityTab() {
  const [method, setMethod] = useState("SHAP");
  const [globalTab, setGlobalTab] = useState("SHAP");
  const [selectedPresetKey, setSelectedPresetKey] = useState("highRisk");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(PRESETS.highRisk);
  const [globalShap, setGlobalShap] = useState(DEFAULT_SHAP_GLOBAL);
  const [globalLime, setGlobalLime] = useState(DEFAULT_LIME_GLOBAL);

  // Fetch initial global importances if backend has them
  useEffect(() => {
    const fetchGlobal = async () => {
      try {
        const res = await api.getGlobalExplanations();
        if (res.shap_importance && res.shap_importance.length > 0) {
          setGlobalShap(res.shap_importance);
        }
        if (res.lime_importance && res.lime_importance.length > 0) {
          setGlobalLime(res.lime_importance);
        }
      } catch (e) {
        console.warn("Could not load backend global explanations, using benchmark defaults.", e);
      }
    };
    fetchGlobal();
  }, []);

  const handleExplainPrediction = async () => {
    setLoading(true);
    try {
      const preset = PRESETS[selectedPresetKey];
      const res = await api.explainInstance({
        module_id: preset.name,
        method: method
      });

      if (res && res.top_contributing) {
        setData({
          name: preset.name,
          predicted_result: res.predicted_result || preset.predicted_result,
          probability: res.probability !== undefined ? res.probability : preset.probability,
          base_value: res.base_value || preset.base_value,
          top_contributing: res.top_contributing.map(t => ({
            ...t,
            bar_pct: t.bar_percentage || Math.min(100, Math.round((Math.abs(t.contribution) / 0.35) * 100))
          })),
          takeaway: res.key_takeaway || preset.takeaway
        });
      } else {
        setData(preset);
      }
    } catch (e) {
      console.warn("Falling back to local high-fidelity preset:", e);
      setData(PRESETS[selectedPresetKey]);
    } finally {
      setTimeout(() => setLoading(false), 300);
    }
  };

  const handlePresetChange = (e) => {
    const key = e.target.value;
    setSelectedPresetKey(key);
    setData(PRESETS[key]);
  };

  // Waterfall plot calculations
  const waterfallSteps = useMemo(() => {
    const steps = (data.top_contributing || []).slice(0, 5);
    const result = [];
    let runningVal = data.base_value || 0;
    for (const s of steps) {
      const start = runningVal;
      runningVal = Math.round((runningVal + s.contribution) * 100) / 100;
      result.push({
        label: s.label.split(" ")[0].replace("(", ""),
        fullLabel: s.label,
        contribution: s.contribution,
        start,
        end: runningVal
      });
    }
    return result;
  }, [data.top_contributing, data.base_value]);

  const maxVal = Math.max(1.0, data.probability + 0.1);

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "8px 0 32px 0" }}>
      {/* 1. Header with Controls */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "16px",
          marginBottom: "24px"
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "26px",
              fontWeight: "800",
              color: "#0f172a",
              letterSpacing: "-0.02em",
              marginBottom: "4px"
            }}
          >
            Explainability
          </h1>
          <p style={{ fontSize: "14px", color: "#64748b" }}>
            Understand why the model made a prediction.
          </p>
        </div>

        {/* Top Right Controls matching screenshot */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
          {/* Module Scenario Selector */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "13px", color: "#64748b", fontWeight: "500" }}>Scenario:</span>
            <select
              value={selectedPresetKey}
              onChange={handlePresetChange}
              style={{
                background: "#ffffff",
                border: "1px solid #cbd5e1",
                borderRadius: "8px",
                padding: "8px 12px",
                fontSize: "13px",
                color: "#1e293b",
                fontWeight: "500",
                cursor: "pointer",
                outline: "none"
              }}
            >
              <option value="highRisk">High Defect Risk (0.87) — Screenshot</option>
              <option value="moderateRisk">Moderate Risk (0.52)</option>
              <option value="cleanModule">Clean Utility (0.09)</option>
            </select>
          </div>

          {/* Method Selector */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "13px", color: "#64748b", fontWeight: "500" }}>Method</span>
            <div style={{ position: "relative" }}>
              <select
                value={method}
                onChange={(e) => {
                  setMethod(e.target.value);
                  setGlobalTab(e.target.value);
                }}
                style={{
                  appearance: "none",
                  background: "#ffffff",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  padding: "8px 32px 8px 12px",
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "#0f172a",
                  cursor: "pointer",
                  outline: "none",
                  minWidth: "110px"
                }}
              >
                <option value="SHAP">SHAP</option>
                <option value="LIME">LIME</option>
              </select>
              <ChevronDown
                size={14}
                color="#64748b"
                style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
              />
            </div>
          </div>

          {/* Explain Prediction Button */}
          <button
            onClick={handleExplainPrediction}
            disabled={loading}
            style={{
              background: "#1d4ed8",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              padding: "9px 20px",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0 1px 2px rgba(29, 78, 216, 0.2)",
              transition: "all 0.15s ease"
            }}
          >
            {loading ? <RefreshCw size={14} className="animate-spin" /> : null}
            <span>Explain Prediction</span>
          </button>
        </div>
      </div>

      {/* 2. Top Two Grid Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(460px, 1fr))",
          gap: "24px",
          marginBottom: "24px"
        }}
      >
        {/* Card 1: Prediction Explanation (SHAP / LIME) */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: "16px",
            border: "1px solid #e2e8f0",
            padding: "24px",
            boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)"
          }}
        >
          <h2
            style={{
              fontSize: "16px",
              fontWeight: "700",
              color: "#0f172a",
              marginBottom: "16px"
            }}
          >
            Prediction Explanation ({method})
          </h2>

          {/* Red/Alert Banner matching screenshot */}
          <div
            style={{
              background: data.probability >= 0.5 ? "#fff1f2" : "#f0fdf4",
              border: `1px solid ${data.probability >= 0.5 ? "#ffe4e6" : "#dcfce7"}`,
              borderRadius: "14px",
              padding: "18px 20px",
              display: "flex",
              alignItems: "center",
              gap: "16px",
              marginBottom: "24px"
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                background: data.probability >= 0.5 ? "#fecdd3" : "#bbf7d0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0
              }}
            >
              {data.probability >= 0.5 ? (
                <AlertTriangle size={24} color="#e11d48" />
              ) : (
                <CheckCircle size={24} color="#16a34a" />
              )}
            </div>

            <div>
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: "600",
                  color: data.probability >= 0.5 ? "#e11d48" : "#16a34a",
                  textTransform: "capitalize",
                  marginBottom: "2px"
                }}
              >
                Predicted Result
              </div>
              <div
                style={{
                  fontSize: "20px",
                  fontWeight: "800",
                  color: data.probability >= 0.5 ? "#be123c" : "#15803d",
                  letterSpacing: "-0.01em",
                  marginBottom: "4px"
                }}
              >
                {data.predicted_result}
              </div>
              <div style={{ fontSize: "13px", fontWeight: "600", color: "#334155" }}>
                Probability: {data.probability.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Top Contributing Features Sub-header */}
          <h3
            style={{
              fontSize: "14px",
              fontWeight: "700",
              color: "#0f172a",
              marginBottom: "12px"
            }}
          >
            Top Contributing Features
          </h3>

          {/* Clean Data Table */}
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #f1f5f9", textAlign: "left" }}>
                  <th style={{ padding: "8px 4px", color: "#64748b", fontWeight: "600", width: "42%" }}>
                    Feature
                  </th>
                  <th style={{ padding: "8px 4px", color: "#64748b", fontWeight: "600", width: "40%" }}>
                    Contribution
                  </th>
                  <th style={{ padding: "8px 4px", color: "#64748b", fontWeight: "600", textAlign: "right" }}>
                    Impact
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.top_contributing.map((item, idx) => {
                  const isHigh = item.impact === "High";
                  const isMed = item.impact === "Medium";
                  const barColor = isHigh ? "#f43f5e" : isMed ? "#f97316" : "#eab308";
                  const badgeBg = isHigh ? "#ffe4e6" : isMed ? "#ffedd5" : "#fef9c3";
                  const badgeColor = isHigh ? "#e11d48" : isMed ? "#c2410c" : "#854d0e";

                  return (
                    <tr key={idx} style={{ borderBottom: "1px solid #f8fafc" }}>
                      <td style={{ padding: "12px 4px", fontWeight: "500", color: "#1e293b" }}>
                        {item.label}
                      </td>
                      <td style={{ padding: "12px 4px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          {/* Horizontal rounded bar */}
                          <div
                            style={{
                              flex: 1,
                              maxWidth: "110px",
                              height: "8px",
                              background: "#f1f5f9",
                              borderRadius: "999px",
                              overflow: "hidden"
                            }}
                          >
                            <div
                              style={{
                                width: `${item.bar_pct}%`,
                                height: "100%",
                                background: barColor,
                                borderRadius: "999px"
                              }}
                            />
                          </div>
                          <span style={{ fontSize: "12px", fontWeight: "700", color: "#0f172a", minWidth: "40px" }}>
                            {item.contribution > 0 ? `+${item.contribution.toFixed(2)}` : item.contribution.toFixed(2)}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: "12px 4px", textAlign: "right" }}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "3px 12px",
                            borderRadius: "999px",
                            fontSize: "11px",
                            fontWeight: "700",
                            background: badgeBg,
                            color: badgeColor
                          }}
                        >
                          {item.impact}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Card 2: Feature Importance (Global) */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: "16px",
            border: "1px solid #e2e8f0",
            padding: "24px",
            boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
            display: "flex",
            flexDirection: "column"
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "16px"
            }}
          >
            <h2 style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a" }}>
              Feature Importance (Global)
            </h2>
          </div>

          {/* Sub-tabs: SHAP | LIME */}
          <div
            style={{
              display: "inline-flex",
              background: "#f1f5f9",
              padding: "3px",
              borderRadius: "8px",
              marginBottom: "20px",
              alignSelf: "flex-start"
            }}
          >
            <button
              onClick={() => setGlobalTab("SHAP")}
              style={{
                border: "none",
                padding: "4px 18px",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: "700",
                background: globalTab === "SHAP" ? "#ffffff" : "transparent",
                color: globalTab === "SHAP" ? "#2563eb" : "#64748b",
                boxShadow: globalTab === "SHAP" ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
                cursor: "pointer"
              }}
            >
              SHAP
            </button>
            <button
              onClick={() => setGlobalTab("LIME")}
              style={{
                border: "none",
                padding: "4px 18px",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: "700",
                background: globalTab === "LIME" ? "#ffffff" : "transparent",
                color: globalTab === "LIME" ? "#2563eb" : "#64748b",
                boxShadow: globalTab === "LIME" ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
                cursor: "pointer"
              }}
            >
              LIME
            </button>
          </div>

          {/* Horizontal Bar Chart matching screenshot */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "16px" }}>
              {(globalTab === "SHAP" ? globalShap : globalLime).map((item, idx) => {
                // Max scale is 0.30 matching axis in screenshot
                const pct = Math.min(100, (item.importance / 0.3) * 100);

                return (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      fontSize: "13px"
                    }}
                  >
                    <span
                      style={{
                        width: "150px",
                        flexShrink: 0,
                        color: "#334155",
                        fontWeight: "500",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis"
                      }}
                      title={item.label}
                    >
                      {item.label}
                    </span>

                    <div style={{ flex: 1, position: "relative", height: "14px", background: "#f8fafc", borderRadius: "3px" }}>
                      <div
                        style={{
                          width: `${pct}%`,
                          height: "100%",
                          background: "#3b82f6",
                          borderRadius: "3px",
                          transition: "width 0.4s ease"
                        }}
                      />
                    </div>

                    <span
                      style={{
                        width: "36px",
                        textAlign: "right",
                        fontWeight: "700",
                        color: "#0f172a",
                        fontSize: "12px"
                      }}
                    >
                      {item.importance.toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* X-Axis scale matching screenshot: 0.0, 0.1, 0.2, 0.3 */}
            <div
              style={{
                marginLeft: "162px",
                marginRight: "48px",
                borderTop: "1px solid #cbd5e1",
                paddingTop: "6px",
                display: "flex",
                justifyContent: "space-between",
                fontSize: "11px",
                fontWeight: "600",
                color: "#64748b"
              }}
            >
              <span>0.0</span>
              <span>0.1</span>
              <span>0.2</span>
              <span>0.3</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Bottom Two Grid Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(460px, 1fr))",
          gap: "24px"
        }}
      >
        {/* Card 3: Local Explanation (SHAP - Waterfall Plot) */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: "16px",
            border: "1px solid #e2e8f0",
            padding: "24px",
            boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)"
          }}
        >
          <h2
            style={{
              fontSize: "16px",
              fontWeight: "700",
              color: "#0f172a",
              marginBottom: "24px"
            }}
          >
            Local Explanation ({method} - Waterfall Plot)
          </h2>

          {/* SVG/Canvas Waterfall Graphic */}
          <div
            style={{
              height: "220px",
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              padding: "0 10px 32px 10px",
              position: "relative",
              borderBottom: "1px solid #e2e8f0"
            }}
          >
            {/* Base Value Line & Text on Left */}
            <div
              style={{
                position: "absolute",
                left: "12px",
                bottom: "70px",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                zIndex: 2
              }}
            >
              <span style={{ fontSize: "11px", fontWeight: "600", color: "#64748b" }}>
                Base value
              </span>
              <span style={{ fontSize: "13px", fontWeight: "800", color: "#0f172a" }}>
                {data.base_value.toFixed(2)}
              </span>
            </div>

            {/* Placeholder spacer for base value text */}
            <div style={{ width: "60px" }} />

            {/* Floating Incremental Step Bars */}
            {waterfallSteps.map((step, idx) => {
              // Scale to height (max height ~140px)
              const barHeight = Math.max(16, Math.round((Math.abs(step.contribution) / maxVal) * 130));
              const bottomOffset = Math.round((step.start / maxVal) * 130) + 10;
              const isPositive = step.contribution >= 0;

              return (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    position: "relative",
                    flex: 1,
                    maxWidth: "60px"
                  }}
                >
                  {/* Floating Step Box */}
                  <div
                    style={{
                      position: "absolute",
                      bottom: `${bottomOffset}px`,
                      width: "44px",
                      height: `${barHeight}px`,
                      background: isPositive ? "#f43f5e" : "#10b981",
                      borderRadius: "3px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "flex-start",
                      boxShadow: "0 1px 3px rgba(244, 63, 94, 0.2)"
                    }}
                  >
                    {/* Value above bar */}
                    <span
                      style={{
                        position: "absolute",
                        top: "-20px",
                        fontSize: "11px",
                        fontWeight: "700",
                        color: isPositive ? "#e11d48" : "#059669"
                      }}
                    >
                      {isPositive ? `+${step.contribution.toFixed(2)}` : step.contribution.toFixed(2)}
                    </span>
                  </div>

                  {/* Feature Label Below Baseline */}
                  <span
                    style={{
                      position: "absolute",
                      bottom: "-24px",
                      fontSize: "11px",
                      fontWeight: "600",
                      color: "#64748b",
                      whiteSpace: "nowrap"
                    }}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}

            {/* Final Output Bar (Solid Blue Bar on Right) */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                position: "relative",
                width: "60px"
              }}
            >
              <div
                style={{
                  width: "44px",
                  height: `${Math.round((data.probability / maxVal) * 140)}px`,
                  background: "#2563eb",
                  borderRadius: "3px 3px 0 0",
                  position: "relative",
                  boxShadow: "0 2px 4px rgba(37, 99, 235, 0.25)"
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: "-36px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    whiteSpace: "nowrap"
                  }}
                >
                  <span style={{ fontSize: "11px", fontWeight: "600", color: "#2563eb" }}>Output</span>
                  <span style={{ fontSize: "13px", fontWeight: "800", color: "#1e3a8a" }}>
                    {data.probability.toFixed(2)}
                  </span>
                </div>
              </div>

              <span
                style={{
                  position: "absolute",
                  bottom: "-24px",
                  fontSize: "11px",
                  fontWeight: "700",
                  color: "#1e3a8a"
                }}
              >
                Output
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Key Takeaway */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: "16px",
            border: "1px solid #e2e8f0",
            padding: "24px",
            boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                background: "#eff6ff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0
              }}
            >
              <Lightbulb size={22} color="#2563eb" />
            </div>
            <h2 style={{ fontSize: "17px", fontWeight: "700", color: "#0f172a" }}>
              Key Takeaway
            </h2>
          </div>

          <p
            style={{
              fontSize: "15px",
              lineHeight: "1.6",
              color: "#334155",
              fontWeight: "500",
              marginBottom: "20px"
            }}
          >
            {data.takeaway}
          </p>

          <div
            style={{
              background: "#f8fafc",
              border: "1px dashed #cbd5e1",
              borderRadius: "10px",
              padding: "14px 16px",
              fontSize: "13px",
              color: "#64748b",
              display: "flex",
              alignItems: "flex-start",
              gap: "10px"
            }}
          >
            <Info size={16} color="#3b82f6" style={{ marginTop: "2px", flexShrink: 0 }} />
            <div>
              <strong style={{ color: "#1e293b" }}>Refactoring Recommendation:</strong>
              <div style={{ marginTop: "2px" }}>
                Targeting <strong>Cyclomatic Complexity</strong> and <strong>Lines of Code</strong> will yield the highest reduction in defect probability according to both local and global SHAP gradients.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
