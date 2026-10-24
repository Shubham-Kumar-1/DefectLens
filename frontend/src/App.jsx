import React, { useState, useEffect } from "react";
import {
  Home,
  Shield,
  Lightbulb,
  Activity,
  ShieldCheck,
  Link2,
  FileText,
  Settings,
  Cpu,
  ChevronDown,
  User,
  Sparkles
} from "lucide-react";
import DashboardHomeView from "./components/dashboard/DashboardHomeView";
import TrainingTab from "./components/TrainingTab";
import PredictionTab from "./components/PredictionTab";
import ShiftTab from "./components/ShiftTab";
import CrossProjectTab from "./components/CrossProjectTab";
import ExplainabilityTab from "./components/ExplainabilityTab";
import ReliabilityTab from "./components/ReliabilityTab";
import ReportsTab from "./components/ReportsTab";
import Setting from "./components/Settings";
import { api } from "./services/api";

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [datasets, setDatasets] = useState([]);
  const [currentModel, setCurrentModel] = useState(null);
  const [stats, setStats] = useState({});
  const [shiftData, setShiftData] = useState(null);
  const [crossResults, setCrossResults] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [latestPrediction, setLatestPrediction] = useState(null);
  const [selectedProject, setSelectedProject] = useState("NASA-MDP (Within-Project)");

  // Initial load
  useEffect(() => {
    const initData = async () => {
      try {
        const [dsRes, modelRes, statsRes, histRes] = await Promise.all([
          api.getDatasets().catch(() => ({ datasets: [] })),
          api.getCurrentModel().catch(() => null),
          api.getStats().catch(() => ({})),
          api.getTemporalHistory().catch(() => ({ history: [] }))
        ]);

        setDatasets(dsRes.datasets || []);
        setCurrentModel(modelRes);
        setStats(statsRes);
        setHistoryData(histRes.history || []);

        // Initial default shift analysis for dashboard card
        const shiftRes = await api.analyzeShift("project_shifted_2026").catch(() => null);
        if (shiftRes) setShiftData(shiftRes);

        // Initial cross-project results for card
        const crossRes = await api.crossProjectEvaluation({
          source_dataset: "jm1",
          target_datasets: ["kc1", "kc2", "pc1", "project_shifted_2026"],
          algorithm: "random_forest"
        }).catch(() => null);
        if (crossRes) setCrossResults(crossRes);

        // Fetch recent prediction for local SHAP card
        const predsRes = await api.getPredictionHistory().catch(() => ({ history: [] }));
        if (predsRes.history && predsRes.history.length > 0) {
          const p = predsRes.history[0];
          setLatestPrediction({
            prediction: p.prediction,
            probability: p.probability,
            shap_explanation: {
              all_contributions: [
                { feature: "CBO", contribution: 0.21 },
                { feature: "RFC", contribution: 0.17 },
                { feature: "LOC", contribution: 0.10 },
                { feature: "WMC", contribution: -0.08 },
                { feature: "DIT", contribution: -0.05 }
              ]
            },
            reliability: {
              reliability_score: p.reliability_score,
              reliability_status: p.reliability_status,
              ood_result: { mahalanobis_distance: 21.0 }
            }
          });
        }
      } catch (e) {
        console.error("Initialization error:", e);
      }
    };
    initData();
  }, []);

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "predict", label: "Defect Prediction", icon: Shield },
    { id: "explainability", label: "Explainability", icon: Lightbulb },
    { id: "shift", label: "Dataset Shift Analysis", icon: Activity },
    { id: "reliability", label: "Reliability & Uncertainty", icon: ShieldCheck },
    { id: "crossproject", label: "Cross-Project Analysis", icon: Link2 },
    { id: "reports", label: "Reports", icon: FileText },
    { id: "settings", label: "Model Training", icon: Cpu },
    { id: "setting", label: "Settings", icon: Settings }
  ];

  return (
    <div className="defectlens-container">
      {/* 1. Left Dark Sidebar */}
      <aside className="sidebar">
        <div>
          {/* Brand Logo & Title */}
          <div className="brand-section">
            <div className="brand-icon">
              <div style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#3b82f6" }}></div>
            </div>
            <div>
              <div className="brand-title">DefectLens</div>
              <div className="brand-subtitle">Predict &bull; Explain &bull; Monitor</div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="sidebar-nav">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`nav-item ${isActive ? "active" : ""}`}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Sidebar Callout Box */}
        <div className="sidebar-footer-card">
          <div className="footer-icon-circle">
            <Sparkles size={16} />
          </div>
          <div>
            <div className="footer-text-title">Smarter Insights. Healthier Software.</div>
            <div className="footer-text-desc">
              DefectLens helps you find defects, understand why, and stay ahead of data changes.
            </div>
          </div>
        </div>
      </aside>

      {/* 2. Main Area (White/Light Theme matching screenshot) */}
      <div className="main-wrapper">
        {/* Top Navbar */}
        <header className="top-navbar">
          {/* Project Dropdown */}
          <div className="project-select-group">
            <span className="project-label">Project</span>
            <select
              className="project-dropdown"
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
            >
              <option value="NASA-MDP (Within-Project)">NASA-MDP (Within-Project)</option>
              {datasets.map((d) => (
                <option key={d.name} value={d.name}>
                  NASA {d.name} ({d.domain_type})
                </option>
              ))}
            </select>
          </div>

          {/* Top Navbar Right Status & User */}
          <div className="top-navbar-right">
            <div className="model-status-indicator">
              <div className="status-dot-green"></div>
              <span style={{ color: "#64748b" }}>Model Status</span>
              <strong style={{ color: "#0f172a" }}>Healthy</strong>
            </div>

            <button className="user-profile-btn">
              <div className="user-avatar-circle">
                <User size={16} />
              </div>
              <span>User</span>
              <ChevronDown size={14} color="#64748b" />
            </button>
          </div>
        </header>

        {/* Main Content Pages */}
        <main style={{ flex: 1 }}>
          {activeTab === "dashboard" && (
            <DashboardHomeView
              datasets={datasets}
              currentModel={currentModel}
              stats={stats}
              shiftData={shiftData}
              crossResults={crossResults}
              historyData={historyData}
              latestPrediction={latestPrediction}
              onNavigateTab={(tabId) => setActiveTab(tabId)}
            />
          )}

          {activeTab === "predict" && (
            <div style={{ padding: "32px", maxWidth: "1440px", margin: "0 auto" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <div>
                  <h1 style={{ fontSize: "22px", fontWeight: "700" }}>Defect Prediction &amp; Reliability Assessment</h1>
                  <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>Inspect module risk, local SHAP/LIME waterfalls, and the Confidence vs Reliability index.</p>
                </div>
                <button onClick={() => setActiveTab("dashboard")} className="pill-tab" style={{ padding: "6px 14px", border: "1px solid #d1d5db" }}>
                  &larr; Back to Dashboard
                </button>
              </div>
              <PredictionTab currentModel={currentModel} />
            </div>
          )}

          {activeTab === "explainability" && (
            <div style={{ padding: "32px", maxWidth: "1440px", margin: "0 auto" }}>
              <ExplainabilityTab />
            </div>
          )}

          {activeTab === "shift" && (
            <div style={{ padding: "32px", maxWidth: "1440px", margin: "0 auto" }}>
              <ShiftTab datasets={datasets} currentModel={currentModel} />
            </div>
          )}

          {activeTab === "reliability" && (
            <div style={{ padding: "32px", maxWidth: "1440px", margin: "0 auto" }}>
              <ReliabilityTab />
            </div>
          )}

          {activeTab === "crossproject" && (
            <div style={{ padding: "32px", maxWidth: "1440px", margin: "0 auto" }}>
              <CrossProjectTab datasets={datasets} currentModel={currentModel} />
            </div>
          )}

          {activeTab === "reports" && (
            <div style={{ padding: "32px", maxWidth: "1440px", margin: "0 auto" }}>
              <ReportsTab currentModel={currentModel} />
            </div>
          )}

          {activeTab === "settings" && (
            <div style={{ padding: "32px", maxWidth: "1440px", margin: "0 auto" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <div>
                  <h1 style={{ fontSize: "22px", fontWeight: "700" }}>Model Training &amp; Hyperparameter Configuration</h1>
                  <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>Train Random Forest, XGBoost, or Logistic Regression with probability calibration on any benchmark.</p>
                </div>
                <button onClick={() => setActiveTab("dashboard")} className="pill-tab" style={{ padding: "6px 14px", border: "1px solid #d1d5db" }}>
                  &larr; Back to Dashboard
                </button>
              </div>
              <TrainingTab
                datasets={datasets}
                currentModel={currentModel}
                onModelTrained={(meta) => setCurrentModel({ metadata: meta, loaded: true })}
              />
            </div>
          )}

          {activeTab === "setting" && (
            <div style={{ padding: "32px", maxWidth: "1440px", margin: "0 auto" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <div>
                  <h1 style={{ fontSize: "22px", fontWeight: "700" }}>System &amp; Application Settings</h1>
                  <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>Configure environment parameters, model preferences, shift thresholds, and explainability options.</p>
                </div>
                <button onClick={() => setActiveTab("dashboard")} className="pill-tab" style={{ padding: "6px 14px", border: "1px solid #d1d5db" }}>
                  &larr; Back to Dashboard
                </button>
              </div>
              <Setting />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
