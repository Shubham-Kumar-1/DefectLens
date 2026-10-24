import React, { useState, useEffect } from "react";
import {
  Shield,
  AlertTriangle,
  RefreshCw
} from "lucide-react";
import { api } from "../services/api";

const PRESETS = {
  mediumRisk: {
    tier: "Medium",
    color: "#d97706",
    bg: "#fffbeb",
    border: "#fef3c7",
    iconBg: "#fef3c7",
    message: "High defect risk with moderate reliability due to dataset shift and model uncertainty.",
    factors: {
      model_confidence: 0.86,
      uncertainty_ece: 0.18,
      dataset_shift_score: 0.32,
      ood_mahalanobis: 0.21
    },
    ece: 0.18,
    ece_status: "Good",
    warning: {
      title: "Reliability Warning",
      message: "Prediction confidence is high, but dataset shift is significant. Verify the result before taking action."
    },
    uncertainty_measures: [
      { name: "Entropy", value: 0.24, status: "Low" },
      { name: "Variation Ratio", value: 0.17, status: "Low" }
    ]
  },
  highReliability: {
    tier: "High",
    color: "#16a34a",
    bg: "#f0fdf4",
    border: "#dcfce7",
    iconBg: "#dcfce7",
    message: "Prediction generated within familiar training distributions. Safe for automated defect triage.",
    factors: {
      model_confidence: 0.92,
      uncertainty_ece: 0.08,
      dataset_shift_score: 0.05,
      ood_mahalanobis: 0.04
    },
    ece: 0.08,
    ece_status: "Excellent",
    warning: {
      title: "Trusted Prediction",
      message: "Model outputs match calibration targets with no significant covariate drift."
    },
    uncertainty_measures: [
      { name: "Entropy", value: 0.11, status: "Low" },
      { name: "Variation Ratio", value: 0.08, status: "Low" }
    ]
  },
  lowReliability: {
    tier: "Low",
    color: "#e11d48",
    bg: "#fff1f2",
    border: "#ffe4e6",
    iconBg: "#fecdd3",
    message: "Severe dataset shift and out-of-distribution metrics detected. Statistical confidence is deceptive.",
    factors: {
      model_confidence: 0.89,
      uncertainty_ece: 0.34,
      dataset_shift_score: 0.68,
      ood_mahalanobis: 0.62
    },
    ece: 0.34,
    ece_status: "High Uncertainty",
    warning: {
      title: "Overconfidence Paradox",
      message: "Model outputs high statistical confidence (89%), but module metrics are severely out-of-distribution."
    },
    uncertainty_measures: [
      { name: "Entropy", value: 0.48, status: "High" },
      { name: "Variation Ratio", value: 0.42, status: "High" }
    ]
  }
};

const CALIBRATION_POINTS = [
  { prob: 0.0, acc: 0.05 },
  { prob: 0.2, acc: 0.31 },
  { prob: 0.3, acc: 0.38 },
  { prob: 0.4, acc: 0.45 },
  { prob: 0.5, acc: 0.53 },
  { prob: 0.6, acc: 0.60 },
  { prob: 0.7, acc: 0.67 },
  { prob: 0.8, acc: 0.73 },
  { prob: 0.9, acc: 0.80 },
  { prob: 1.0, acc: 0.89 }
];

export default function ReliabilityTab() {
  const [selectedPresetKey, setSelectedPresetKey] = useState("mediumRisk");
  const [data, setData] = useState(PRESETS.mediumRisk);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await api.getReliabilityMetrics();
        if (res && res.factors) {
          setData(prev => ({
            ...prev,
            tier: res.reliability_tier || prev.tier,
            message: res.reliability_message || prev.message,
            factors: res.factors || prev.factors,
            ece: res.ece || prev.ece,
            ece_status: res.ece_status || prev.ece_status,
            warning: res.warning || prev.warning,
            uncertainty_measures: res.uncertainty_measures || prev.uncertainty_measures
          }));
        }
      } catch (e) {
        console.warn("Using benchmark reliability data:", e);
      }
    };
    fetchMetrics();
  }, []);

  const handlePresetChange = (e) => {
    const key = e.target.value;
    setSelectedPresetKey(key);
    setData(PRESETS[key]);
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const res = await api.getReliabilityMetrics();
      if (res && res.factors && selectedPresetKey === "mediumRisk") {
        setData(prev => ({ ...prev, ...res }));
      }
    } catch (e) {
      console.warn(e);
    } finally {
      setTimeout(() => setLoading(false), 300);
    }
  };

  // Radial Donut gauge computation for ECE (0.18 -> arc)
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (data.ece / 0.5) * (circumference * 0.75);

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "8px 0 32px 0" }}>
      {/* 1. Header with Controls matching screenshot */}
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
            Reliability &amp; Uncertainty
          </h1>
          <p style={{ fontSize: "14px", color: "#64748b" }}>
            Assess prediction confidence and reliability based on uncertainty and dataset shift.
          </p>
        </div>

        {/* Top Right Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
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
              <option value="mediumRisk">Medium Reliability (Shifted - Screenshot)</option>
              <option value="highReliability">High Reliability (In-Distribution)</option>
              <option value="lowReliability">Low Reliability (Severe OOD)</option>
            </select>
          </div>

          <button
            onClick={handleRefresh}
            disabled={loading}
            style={{
              background: "#1d4ed8",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              padding: "9px 18px",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0 1px 2px rgba(29, 78, 216, 0.2)"
            }}
          >
            {loading ? <RefreshCw size={14} className="animate-spin" /> : null}
            <span>Recalculate</span>
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
        {/* Card 1: Prediction Reliability Card matching screenshot */}
        <div
          style={{
            background: data.bg,
            borderRadius: "16px",
            border: `1px solid ${data.border}`,
            padding: "28px 24px",
            boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
            display: "flex",
            alignItems: "center",
            gap: "20px"
          }}
        >
          {/* Circular shield badge icon */}
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              background: data.iconBg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0
            }}
          >
            <Shield size={28} color={data.color} />
          </div>

          <div>
            <div
              style={{
                fontSize: "13px",
                fontWeight: "700",
                color: data.color,
                marginBottom: "4px"
              }}
            >
              Prediction Reliability
            </div>
            <div
              style={{
                fontSize: "28px",
                fontWeight: "800",
                color: data.color,
                letterSpacing: "-0.02em",
                marginBottom: "8px"
              }}
            >
              {data.tier}
            </div>
            <p style={{ fontSize: "13px", color: "#475569", lineHeight: "1.5" }}>
              {data.message}
            </p>
          </div>
        </div>

        {/* Card 2: Reliability Factors */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: "16px",
            border: "1px solid #e2e8f0",
            padding: "24px",
            boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)"
          }}
        >
          <h2 style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a", marginBottom: "20px" }}>
            Reliability Factors
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Factor 1: Model Confidence */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>
                <span style={{ color: "#334155" }}>Model Confidence</span>
                <span style={{ color: "#0f172a" }}>{data.factors.model_confidence.toFixed(2)}</span>
              </div>
              <div style={{ width: "100%", height: "8px", background: "#f1f5f9", borderRadius: "999px", overflow: "hidden" }}>
                <div
                  style={{
                    width: `${data.factors.model_confidence * 100}%`,
                    height: "100%",
                    background: "#10b981",
                    borderRadius: "999px",
                    transition: "width 0.4s ease"
                  }}
                />
              </div>
            </div>

            {/* Factor 2: Uncertainty (ECE) */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>
                <span style={{ color: "#334155" }}>Uncertainty (ECE)</span>
                <span style={{ color: "#0f172a" }}>{data.factors.uncertainty_ece.toFixed(2)}</span>
              </div>
              <div style={{ width: "100%", height: "8px", background: "#f1f5f9", borderRadius: "999px", overflow: "hidden" }}>
                <div
                  style={{
                    width: `${Math.min(100, data.factors.uncertainty_ece * 100)}%`,
                    height: "100%",
                    background: "#f59e0b",
                    borderRadius: "999px",
                    transition: "width 0.4s ease"
                  }}
                />
              </div>
            </div>

            {/* Factor 3: Dataset Shift Score */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>
                <span style={{ color: "#334155" }}>Dataset Shift Score</span>
                <span style={{ color: "#0f172a" }}>{data.factors.dataset_shift_score.toFixed(2)}</span>
              </div>
              <div style={{ width: "100%", height: "8px", background: "#f1f5f9", borderRadius: "999px", overflow: "hidden" }}>
                <div
                  style={{
                    width: `${Math.min(100, data.factors.dataset_shift_score * 100)}%`,
                    height: "100%",
                    background: "#f97316",
                    borderRadius: "999px",
                    transition: "width 0.4s ease"
                  }}
                />
              </div>
            </div>

            {/* Factor 4: OOD Score (Mahalanobis) */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>
                <span style={{ color: "#334155" }}>OOD Score (Mahalanobis)</span>
                <span style={{ color: "#0f172a" }}>{data.factors.ood_mahalanobis.toFixed(2)}</span>
              </div>
              <div style={{ width: "100%", height: "8px", background: "#f1f5f9", borderRadius: "999px", overflow: "hidden" }}>
                <div
                  style={{
                    width: `${Math.min(100, data.factors.ood_mahalanobis * 100)}%`,
                    height: "100%",
                    background: "#f59e0b",
                    borderRadius: "999px",
                    transition: "width 0.4s ease"
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Bottom Row Grid (3 Columns matching screenshot) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
          gap: "24px"
        }}
      >
        {/* Card 3: Calibration Curve matching screenshot */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: "16px",
            border: "1px solid #e2e8f0",
            padding: "24px",
            boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <h2 style={{ fontSize: "15px", fontWeight: "700", color: "#0f172a" }}>
              Calibration Curve
            </h2>
          </div>

          {/* Legend matching screenshot */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "16px", marginBottom: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "#334155", fontWeight: "600" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#2563eb" }} />
              <span>Model</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "#64748b", fontWeight: "600" }}>
              <span style={{ letterSpacing: "-1px" }}>- - -</span>
              <span>Perfectly Calibrated</span>
            </div>
          </div>

          {/* SVG Calibration Chart */}
          <div style={{ position: "relative", width: "100%", height: "190px" }}>
            <svg viewBox="0 0 280 180" style={{ width: "100%", height: "100%", overflow: "visible" }}>
              {/* Y-Axis Label & Grid Lines */}
              <text x="8" y="90" fill="#64748b" fontSize="9" fontWeight="600" transform="rotate(-90 8,90)" textAnchor="middle">
                Actual Accuracy
              </text>

              {/* Grid Lines for Y: 0.0, 0.2, 0.4, 0.6, 0.8, 1.0 */}
              {[0, 0.2, 0.4, 0.6, 0.8, 1.0].map((val, idx) => {
                const y = 150 - val * 130;
                return (
                  <g key={idx}>
                    <line x1="35" y1={y} x2="265" y2={y} stroke="#f1f5f9" strokeWidth="1" />
                    <text x="30" y={y + 3} fill="#64748b" fontSize="8" textAnchor="end">{val.toFixed(1)}</text>
                  </g>
                );
              })}

              {/* X-Axis Ticks */}
              {[0, 0.2, 0.4, 0.6, 0.8, 1.0].map((val, idx) => {
                const x = 35 + val * 230;
                return (
                  <g key={idx}>
                    <text x={x} y="165" fill="#64748b" fontSize="8" textAnchor="middle">{val.toFixed(1)}</text>
                  </g>
                );
              })}

              {/* Axes lines */}
              <line x1="35" y1="20" x2="35" y2="150" stroke="#cbd5e1" strokeWidth="1" />
              <line x1="35" y1="150" x2="265" y2="150" stroke="#cbd5e1" strokeWidth="1" />

              {/* Diagonal Dashed Line (Perfect Calibration y = x) */}
              <line x1="35" y1="150" x2="265" y2="20" stroke="#93c5fd" strokeWidth="1.5" strokeDasharray="4 3" />

              {/* Model Points and Connecting Curve */}
              <path
                d="M 35 144 L 81 110 L 104 100 L 127 91 L 150 81 L 173 72 L 196 63 L 219 55 L 242 46 L 265 34"
                fill="none"
                stroke="#2563eb"
                strokeWidth="2"
              />

              {CALIBRATION_POINTS.map((pt, idx) => {
                const cx = 35 + pt.prob * 230;
                const cy = 150 - pt.acc * 130;
                return (
                  <circle key={idx} cx={cx} cy={cy} r="3" fill="#2563eb" stroke="#ffffff" strokeWidth="1" />
                );
              })}
            </svg>
          </div>

          <div style={{ textAlign: "center", fontSize: "10px", fontWeight: "700", color: "#475569", marginTop: "4px" }}>
            Predicted Probability
          </div>
        </div>

        {/* Card 4: Uncertainty Analysis (Radial Donut Gauge) */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: "16px",
            border: "1px solid #e2e8f0",
            padding: "24px",
            boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-between"
          }}
        >
          <div style={{ width: "100%", textAlign: "left", marginBottom: "8px" }}>
            <h2 style={{ fontSize: "15px", fontWeight: "700", color: "#0f172a" }}>
              Uncertainty Analysis
            </h2>
          </div>

          {/* Radial Donut Gauge matching screenshot */}
          <div style={{ position: "relative", width: "150px", height: "150px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="150" height="150" viewBox="0 0 120 120">
              {/* Dark base ring */}
              <circle
                cx="60"
                cy="60"
                r={radius}
                fill="none"
                stroke="#1e293b"
                strokeWidth="12"
              />
              {/* Green active arc */}
              <circle
                cx="60"
                cy="60"
                r={radius}
                fill="none"
                stroke="#10b981"
                strokeWidth="12"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                transform="rotate(-90 60 60)"
              />
            </svg>

            {/* Inner Content */}
            <div
              style={{
                position: "absolute",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <span style={{ fontSize: "24px", fontWeight: "800", color: "#0f172a", letterSpacing: "-0.02em" }}>
                {data.ece.toFixed(2)}
              </span>
              <span style={{ fontSize: "11px", fontWeight: "700", color: "#64748b" }}>
                ECE
              </span>
            </div>
          </div>

          {/* Subtext and Badge */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", marginTop: "12px" }}>
            <span style={{ fontSize: "12px", color: "#64748b" }}>
              Lower is better
            </span>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                padding: "4px 16px",
                borderRadius: "999px",
                background: "#dcfce7",
                color: "#16a34a",
                fontSize: "12px",
                fontWeight: "700"
              }}
            >
              ✓ {data.ece_status}
            </span>
          </div>
        </div>

        {/* Card 5: Two Stacked Cards (Reliability Warning & Model Uncertainty Example) */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Card 5A: Reliability Warning */}
          <div
            style={{
              background: "#fffbeb",
              border: "1px solid #fef3c7",
              borderRadius: "16px",
              padding: "20px",
              boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
              flex: 1,
              display: "flex",
              alignItems: "flex-start",
              gap: "14px"
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                background: "#fef3c7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0
              }}
            >
              <AlertTriangle size={20} color="#d97706" />
            </div>

            <div>
              <h3 style={{ fontSize: "15px", fontWeight: "800", color: "#b45309", marginBottom: "6px" }}>
                {data.warning.title}
              </h3>
              <p style={{ fontSize: "13px", color: "#475569", lineHeight: "1.5" }}>
                {data.warning.message}
              </p>
            </div>
          </div>

          {/* Card 5B: Model Uncertainty (Example) */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "16px",
              padding: "20px",
              boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between"
            }}
          >
            <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#0f172a", marginBottom: "14px" }}>
              Model Uncertainty (Example)
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {data.uncertainty_measures.map((m, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    fontSize: "13px"
                  }}
                >
                  <span style={{ color: "#334155", fontWeight: "500" }}>{m.name}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <span style={{ fontWeight: "700", color: "#0f172a" }}>{m.value.toFixed(2)}</span>
                    <span
                      style={{
                        padding: "3px 14px",
                        borderRadius: "999px",
                        fontSize: "11px",
                        fontWeight: "700",
                        background: m.status === "Low" ? "#dcfce7" : "#fee2e2",
                        color: m.status === "Low" ? "#16a34a" : "#e11d48",
                        minWidth: "50px",
                        textAlign: "center"
                      }}
                    >
                      {m.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
