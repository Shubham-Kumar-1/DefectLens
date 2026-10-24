import React, { useState } from "react";
import {
  Settings as SettingsIcon,
  Database,
  Brain,
  Lightbulb,
  RefreshCw,
  Shield,
  Folder,
  ChevronDown,
  ChevronUp,
  Save,
  Check,
  Bell,
  Palette,
  Sliders,
  Layers
} from "lucide-react";

export default function Setting() {
  const [activeTab, setActiveTab] = useState("All");
  const [advanced, setAdvanced] = useState(false);
  const [autoSave, setAutoSave] = useState(true);
  const [globalExp, setGlobalExp] = useState(true);
  const [localExp, setLocalExp] = useState(true);
  const [ood, setOod] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [driftNotification, setDriftNotification] = useState(true);
  const [savedNotification, setSavedNotification] = useState(false);

  // Form states
  const [projectName, setProjectName] = useState("DefectLens");
  const [workspaceDir, setWorkspaceDir] = useState("C:\\DefectLens\\data");
  const [selectedModel, setSelectedModel] = useState("xgboost");
  const [trainRatio, setTrainRatio] = useState("70%");
  const [valRatio, setValRatio] = useState("15%");
  const [testRatio, setTestRatio] = useState("15%");
  const [randomState, setRandomState] = useState("42");
  const [cvFolds, setCvFolds] = useState("5 Folds");
  const [maxDepth, setMaxDepth] = useState("6");
  const [learningRate, setLearningRate] = useState("0.1");
  const [nEstimators, setNEstimators] = useState("100");
  const [datasetFormat, setDatasetFormat] = useState("CSV");
  const [scalingMethod, setScalingMethod] = useState("StandardScaler");
  const [imbalanceHandling, setImbalanceHandling] = useState("SMOTE");
  const [ksThreshold, setKsThreshold] = useState("0.05");
  const [psiWarning, setPsiWarning] = useState("0.10");
  const [psiDrift, setPsiDrift] = useState("0.25");
  const [confidenceThreshold, setConfidenceThreshold] = useState("0.80");

  const tabs = [
    { id: "All", label: "All Settings", icon: Layers },
    { id: "General", label: "General", icon: SettingsIcon },
    { id: "Model", label: "Model Training", icon: Brain },
    { id: "Data", label: "Dataset & Prep", icon: Database },
    { id: "Explainability", label: "Explainability", icon: Lightbulb },
    { id: "Shift", label: "Shift Detection", icon: RefreshCw },
    { id: "Reliability", label: "Reliability", icon: Shield },
    { id: "Notifications", label: "Notifications", icon: Bell },
    { id: "Appearance", label: "Appearance", icon: Palette },
  ];

  const handleSave = () => {
    setSavedNotification(true);
    setTimeout(() => setSavedNotification(false), 3000);
  };

  const shouldShow = (tabId) => activeTab === "All" || activeTab === tabId;

  return (
    <div>
      {/* Settings Navigation Tabs */}
      <div className="settings-tabs-nav">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`settings-tab-button ${activeTab === tab.id ? "active" : ""}`}
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                <Icon size={14} />
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Save Notification Toast */}
      {savedNotification && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            backgroundColor: "#ecfdf5",
            border: "1px solid #a7f3d0",
            color: "#065f46",
            padding: "12px 16px",
            borderRadius: "8px",
            marginBottom: "20px",
            fontSize: "13px",
            fontWeight: "600",
            animation: "fadeIn 0.2s ease"
          }}
        >
          <Check size={18} color="#10b981" />
          Settings preferences saved successfully!
        </div>
      )}

      {/* Settings Cards Grid */}
      <div className="settings-grid">

        {/* 1. GENERAL SETTINGS */}
        {shouldShow("General") && (
          <div className="settings-card">
            <div className="settings-card-header">
              <div className="settings-card-icon">
                <SettingsIcon size={20} />
              </div>
              <div>
                <h3 className="settings-card-title">General Settings</h3>
                <p className="settings-card-subtitle">Manage environment workspace and preferences.</p>
              </div>
            </div>

            <div className="settings-card-body">
              <div className="settings-field">
                <label className="settings-label">Project Name</label>
                <input
                  type="text"
                  className="input-field"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                />
              </div>

              <div className="settings-field">
                <label className="settings-label">Workspace Directory</label>
                <div className="settings-input-group">
                  <input
                    type="text"
                    className="input-field"
                    value={workspaceDir}
                    onChange={(e) => setWorkspaceDir(e.target.value)}
                  />
                  <button type="button" className="settings-addon-btn" title="Browse Folder">
                    <Folder size={15} />
                  </button>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div className="settings-field">
                  <label className="settings-label">Language</label>
                  <select className="input-field" defaultValue="English">
                    <option value="English">English (US)</option>
                    <option value="English_UK">English (UK)</option>
                  </select>
                </div>

                <div className="settings-field">
                  <label className="settings-label">Time Zone</label>
                  <select className="input-field" defaultValue="Asia/Kolkata">
                    <option value="Asia/Kolkata">UTC+05:30 IST</option>
                    <option value="UTC">UTC +00:00</option>
                    <option value="America/New_York">UTC-05:00 EST</option>
                  </select>
                </div>
              </div>

              <div className="settings-toggle-row">
                <div className="settings-toggle-info">
                  <div className="settings-toggle-title">Auto Save</div>
                  <div className="settings-toggle-desc">Automatically persist configuration changes</div>
                </div>
                <button
                  type="button"
                  className={`settings-switch ${autoSave ? "active" : ""}`}
                  onClick={() => setAutoSave(!autoSave)}
                  aria-label="Toggle Auto Save"
                >
                  <span className="settings-switch-handle" />
                </button>
              </div>
            </div>

            <div className="settings-footer-actions">
              <button onClick={handleSave} className="btn btn-primary" style={{ padding: "6px 14px", fontSize: "12px" }}>
                <Save size={14} /> Save General
              </button>
            </div>
          </div>
        )}

        {/* 2. MODEL SETTINGS */}
        {shouldShow("Model") && (
          <div className="settings-card">
            <div className="settings-card-header">
              <div className="settings-card-icon" style={{ backgroundColor: "#f5f3ff", color: "#8b5cf6" }}>
                <Brain size={20} />
              </div>
              <div>
                <h3 className="settings-card-title">Model Hyperparameters</h3>
                <p className="settings-card-subtitle">Default training architecture and split ratios.</p>
              </div>
            </div>

            <div className="settings-card-body">
              <div className="settings-field">
                <label className="settings-label">Default Classifier</label>
                <select
                  className="input-field"
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                >
                  <option value="xgboost">XGBoost (Gradient Boosted Trees)</option>
                  <option value="random_forest">Random Forest Classifier</option>
                  <option value="logistic_regression">Logistic Regression (L2)</option>
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
                <div className="settings-field">
                  <label className="settings-label">Train %</label>
                  <input
                    type="text"
                    className="input-field"
                    value={trainRatio}
                    onChange={(e) => setTrainRatio(e.target.value)}
                  />
                </div>
                <div className="settings-field">
                  <label className="settings-label">Val %</label>
                  <input
                    type="text"
                    className="input-field"
                    value={valRatio}
                    onChange={(e) => setValRatio(e.target.value)}
                  />
                </div>
                <div className="settings-field">
                  <label className="settings-label">Test %</label>
                  <input
                    type="text"
                    className="input-field"
                    value={testRatio}
                    onChange={(e) => setTestRatio(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div className="settings-field">
                  <label className="settings-label">Random Seed</label>
                  <input
                    type="text"
                    className="input-field"
                    value={randomState}
                    onChange={(e) => setRandomState(e.target.value)}
                  />
                </div>
                <div className="settings-field">
                  <label className="settings-label">Validation Strategy</label>
                  <select
                    className="input-field"
                    value={cvFolds}
                    onChange={(e) => setCvFolds(e.target.value)}
                  >
                    <option value="5 Folds">5-Fold Stratified CV</option>
                    <option value="10 Folds">10-Fold Stratified CV</option>
                    <option value="Holdout">Single Train-Test Holdout</option>
                  </select>
                </div>
              </div>

              <div className="settings-collapsible">
                <button
                  type="button"
                  className="settings-collapsible-header"
                  onClick={() => setAdvanced(!advanced)}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <Sliders size={14} /> Advanced Tuning Parameters
                  </span>
                  {advanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>

                {advanced && (
                  <div className="settings-collapsible-content">
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
                      <div className="settings-field">
                        <label className="settings-label">Max Depth</label>
                        <input
                          type="text"
                          className="input-field"
                          value={maxDepth}
                          onChange={(e) => setMaxDepth(e.target.value)}
                        />
                      </div>
                      <div className="settings-field">
                        <label className="settings-label">Learning Rate</label>
                        <input
                          type="text"
                          className="input-field"
                          value={learningRate}
                          onChange={(e) => setLearningRate(e.target.value)}
                        />
                      </div>
                      <div className="settings-field">
                        <label className="settings-label">Estimators</label>
                        <input
                          type="text"
                          className="input-field"
                          value={nEstimators}
                          onChange={(e) => setNEstimators(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="settings-footer-actions">
              <button onClick={handleSave} className="btn btn-primary" style={{ padding: "6px 14px", fontSize: "12px" }}>
                <Save size={14} /> Save Model Config
              </button>
            </div>
          </div>
        )}

        {/* 3. DATASET SETTINGS */}
        {shouldShow("Data") && (
          <div className="settings-card">
            <div className="settings-card-header">
              <div className="settings-card-icon" style={{ backgroundColor: "#ecfdf5", color: "#10b981" }}>
                <Database size={20} />
              </div>
              <div>
                <h3 className="settings-card-title">Dataset &amp; Preprocessing</h3>
                <p className="settings-card-subtitle">Format parsers and feature imputation pipelines.</p>
              </div>
            </div>

            <div className="settings-card-body">
              <div className="settings-field">
                <label className="settings-label">Processed Data Directory</label>
                <div className="settings-input-group">
                  <input
                    type="text"
                    className="input-field"
                    defaultValue="backend/data/processed/"
                  />
                  <button type="button" className="settings-addon-btn">
                    <Folder size={15} />
                  </button>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div className="settings-field">
                  <label className="settings-label">Input Format</label>
                  <select
                    className="input-field"
                    value={datasetFormat}
                    onChange={(e) => setDatasetFormat(e.target.value)}
                  >
                    <option value="CSV">CSV (Comma-separated)</option>
                    <option value="ARFF">ARFF (Weka Standard)</option>
                    <option value="Parquet">Apache Parquet</option>
                  </select>
                </div>
                <div className="settings-field">
                  <label className="settings-label">Target Binary Column</label>
                  <input
                    type="text"
                    className="input-field"
                    defaultValue="defects"
                  />
                </div>
              </div>

              <div className="settings-field">
                <label className="settings-label">Feature Normalization</label>
                <select
                  className="input-field"
                  value={scalingMethod}
                  onChange={(e) => setScalingMethod(e.target.value)}
                >
                  <option value="StandardScaler">StandardScaler (Zero-Mean, Unit-Var)</option>
                  <option value="RobustScaler">RobustScaler (Median / IQR for Outliers)</option>
                  <option value="MinMaxScaler">MinMaxScaler [0, 1]</option>
                </select>
              </div>

              <div className="settings-field">
                <label className="settings-label">Class Imbalance Sampling</label>
                <select
                  className="input-field"
                  value={imbalanceHandling}
                  onChange={(e) => setImbalanceHandling(e.target.value)}
                >
                  <option value="SMOTE">SMOTE (Synthetic Minority Over-sampling)</option>
                  <option value="ClassWeights">Class Weights (Inverse Frequency)</option>
                  <option value="RandomUnderSampler">Random Under-sampling</option>
                </select>
              </div>
            </div>

            <div className="settings-footer-actions">
              <button onClick={handleSave} className="btn btn-primary" style={{ padding: "6px 14px", fontSize: "12px" }}>
                <Save size={14} /> Save Data Pipeline
              </button>
            </div>
          </div>
        )}

        {/* 4. EXPLAINABILITY SETTINGS */}
        {shouldShow("Explainability") && (
          <div className="settings-card">
            <div className="settings-card-header">
              <div className="settings-card-icon" style={{ backgroundColor: "#fffbeb", color: "#d97706" }}>
                <Lightbulb size={20} />
              </div>
              <div>
                <h3 className="settings-card-title">Explainability &amp; SHAP</h3>
                <p className="settings-card-subtitle">Configuring local and global attribution methods.</p>
              </div>
            </div>

            <div className="settings-card-body">
              <div className="settings-field">
                <label className="settings-label">Attribution Framework</label>
                <select className="input-field" defaultValue="TreeSHAP">
                  <option value="TreeSHAP">TreeSHAP (Exact Fast Tree Explainer)</option>
                  <option value="KernelSHAP">KernelSHAP (Model-Agnostic Sampling)</option>
                  <option value="LIME">LIME (Local Interpretable Surrogate)</option>
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div className="settings-field">
                  <label className="settings-label">Top Features Shown</label>
                  <select className="input-field" defaultValue="10">
                    <option value="5">Top 5 Features</option>
                    <option value="10">Top 10 Features</option>
                    <option value="15">Top 15 Features</option>
                  </select>
                </div>
                <div className="settings-field">
                  <label className="settings-label">Default Chart Type</label>
                  <select className="input-field" defaultValue="Bar Plot">
                    <option value="Bar Plot">Horizontal Importance Bar</option>
                    <option value="Waterfall">Waterfall Attribution</option>
                    <option value="Beeswarm">Summary Beeswarm</option>
                  </select>
                </div>
              </div>

              <div className="settings-toggle-row">
                <div className="settings-toggle-info">
                  <div className="settings-toggle-title">Global Feature Importance</div>
                  <div className="settings-toggle-desc">Compute dataset-wide mean(|SHAP|) rankings</div>
                </div>
                <button
                  type="button"
                  className={`settings-switch ${globalExp ? "active" : ""}`}
                  onClick={() => setGlobalExp(!globalExp)}
                  aria-label="Toggle Global Explanation"
                >
                  <span className="settings-switch-handle" />
                </button>
              </div>

              <div className="settings-toggle-row">
                <div className="settings-toggle-info">
                  <div className="settings-toggle-title">Local Prediction Waterfalls</div>
                  <div className="settings-toggle-desc">Generate per-file breakdown contributions</div>
                </div>
                <button
                  type="button"
                  className={`settings-switch ${localExp ? "active" : ""}`}
                  onClick={() => setLocalExp(!localExp)}
                  aria-label="Toggle Local Explanation"
                >
                  <span className="settings-switch-handle" />
                </button>
              </div>
            </div>

            <div className="settings-footer-actions">
              <button onClick={handleSave} className="btn btn-primary" style={{ padding: "6px 14px", fontSize: "12px" }}>
                <Save size={14} /> Save SHAP Config
              </button>
            </div>
          </div>
        )}

        {/* 5. SHIFT DETECTION SETTINGS */}
        {shouldShow("Shift") && (
          <div className="settings-card">
            <div className="settings-card-header">
              <div className="settings-card-icon" style={{ backgroundColor: "#eff6ff", color: "#2563eb" }}>
                <RefreshCw size={20} />
              </div>
              <div>
                <h3 className="settings-card-title">Shift Detection &amp; Drift</h3>
                <p className="settings-card-subtitle">Statistical thresholds for Kolmogorov-Smirnov and PSI.</p>
              </div>
            </div>

            <div className="settings-card-body">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div className="settings-field">
                  <label className="settings-label">KS Test Alpha (p-value)</label>
                  <input
                    type="text"
                    className="input-field"
                    value={ksThreshold}
                    onChange={(e) => setKsThreshold(e.target.value)}
                  />
                </div>
                <div className="settings-field">
                  <label className="settings-label">PSI Warning Threshold</label>
                  <input
                    type="text"
                    className="input-field"
                    value={psiWarning}
                    onChange={(e) => setPsiWarning(e.target.value)}
                  />
                </div>
              </div>

              <div className="settings-field">
                <label className="settings-label">PSI Severe Drift Threshold</label>
                <input
                  type="text"
                  className="input-field"
                  value={psiDrift}
                  onChange={(e) => setPsiDrift(e.target.value)}
                />
              </div>

              <div className="settings-field">
                <label className="settings-label">Monitored Metric Categories</label>
                <select className="input-field" defaultValue="All">
                  <option value="All">All Metrics (Halstead, McCabe, LOC, Branch)</option>
                  <option value="McCabe">Complexity Metrics Only (v(g), iv(g))</option>
                  <option value="Volume">Volume &amp; Size Only (LOC, Operands)</option>
                </select>
              </div>

              <div className="settings-field">
                <label className="settings-label">Baseline Reference Dataset</label>
                <select className="input-field" defaultValue="JM1">
                  <option value="JM1">NASA JM1 (Ground Truth Baseline)</option>
                  <option value="KC1">NASA KC1 Storage Subsystem</option>
                  <option value="TrainingSet">Active Trained Model Partition</option>
                </select>
              </div>
            </div>

            <div className="settings-footer-actions">
              <button onClick={handleSave} className="btn btn-primary" style={{ padding: "6px 14px", fontSize: "12px" }}>
                <Save size={14} /> Save Drift Thresholds
              </button>
            </div>
          </div>
        )}

        {/* 6. RELIABILITY SETTINGS */}
        {shouldShow("Reliability") && (
          <div className="settings-card">
            <div className="settings-card-header">
              <div className="settings-card-icon" style={{ backgroundColor: "#fef2f2", color: "#ef4444" }}>
                <Shield size={20} />
              </div>
              <div>
                <h3 className="settings-card-title">Reliability &amp; Uncertainty</h3>
                <p className="settings-card-subtitle">Out-of-distribution distance and probability calibration.</p>
              </div>
            </div>

            <div className="settings-card-body">
              <div className="settings-field">
                <label className="settings-label">Uncertainty Estimation Technique</label>
                <select className="input-field" defaultValue="MCDropout">
                  <option value="MCDropout">Monte Carlo Dropout Ensembling</option>
                  <option value="Entropy">Normalized Softmax Entropy</option>
                  <option value="Bootstrap">Bootstrap Resampling Variance</option>
                </select>
              </div>

              <div className="settings-field">
                <label className="settings-label">Confidence vs Reliability Threshold</label>
                <input
                  type="text"
                  className="input-field"
                  value={confidenceThreshold}
                  onChange={(e) => setConfidenceThreshold(e.target.value)}
                />
              </div>

              <div className="settings-toggle-row">
                <div className="settings-toggle-info">
                  <div className="settings-toggle-title">Mahalanobis OOD Detector</div>
                  <div className="settings-toggle-desc">Flag samples statistically distant from training covariance</div>
                </div>
                <button
                  type="button"
                  className={`settings-switch ${ood ? "active" : ""}`}
                  onClick={() => setOod(!ood)}
                  aria-label="Toggle OOD Detection"
                >
                  <span className="settings-switch-handle" />
                </button>
              </div>

              <div className="settings-field">
                <label className="settings-label">Calibration Mapping</label>
                <select className="input-field" defaultValue="Isotonic">
                  <option value="Isotonic">Isotonic Non-parametric Regression</option>
                  <option value="Platt">Platt Sigmoid Logistic Scaling</option>
                  <option value="None">Raw Uncalibrated Probabilities</option>
                </select>
              </div>
            </div>

            <div className="settings-footer-actions">
              <button onClick={handleSave} className="btn btn-primary" style={{ padding: "6px 14px", fontSize: "12px" }}>
                <Save size={14} /> Save Reliability Config
              </button>
            </div>
          </div>
        )}

        {/* 7. NOTIFICATIONS */}
        {shouldShow("Notifications") && (
          <div className="settings-card">
            <div className="settings-card-header">
              <div className="settings-card-icon" style={{ backgroundColor: "#fef3c7", color: "#f59e0b" }}>
                <Bell size={20} />
              </div>
              <div>
                <h3 className="settings-card-title">Alerts &amp; Notifications</h3>
                <p className="settings-card-subtitle">Automated triggers when models or datasets degrade.</p>
              </div>
            </div>

            <div className="settings-card-body">
              <div className="settings-toggle-row">
                <div className="settings-toggle-info">
                  <div className="settings-toggle-title">Dataset Drift Alerts</div>
                  <div className="settings-toggle-desc">Trigger notification when PSI &gt; 0.25</div>
                </div>
                <button
                  type="button"
                  className={`settings-switch ${driftNotification ? "active" : ""}`}
                  onClick={() => setDriftNotification(!driftNotification)}
                >
                  <span className="settings-switch-handle" />
                </button>
              </div>

              <div className="settings-toggle-row">
                <div className="settings-toggle-info">
                  <div className="settings-toggle-title">Critical High-Risk Defect Alerts</div>
                  <div className="settings-toggle-desc">Notify when probability &gt; 0.85 on production files</div>
                </div>
                <button
                  type="button"
                  className={`settings-switch ${emailAlerts ? "active" : ""}`}
                  onClick={() => setEmailAlerts(!emailAlerts)}
                >
                  <span className="settings-switch-handle" />
                </button>
              </div>

              <div className="settings-field">
                <label className="settings-label">Alert Recipient Email</label>
                <input
                  type="email"
                  className="input-field"
                  defaultValue="audit-team@defectlens.internal"
                />
              </div>
            </div>

            <div className="settings-footer-actions">
              <button onClick={handleSave} className="btn btn-primary" style={{ padding: "6px 14px", fontSize: "12px" }}>
                <Save size={14} /> Save Notifications
              </button>
            </div>
          </div>
        )}

        {/* 8. APPEARANCE */}
        {shouldShow("Appearance") && (
          <div className="settings-card">
            <div className="settings-card-header">
              <div className="settings-card-icon" style={{ backgroundColor: "#e0f2fe", color: "#0284c7" }}>
                <Palette size={20} />
              </div>
              <div>
                <h3 className="settings-card-title">Appearance &amp; Theme</h3>
                <p className="settings-card-subtitle">Display density, chart color themes, and typography.</p>
              </div>
            </div>

            <div className="settings-card-body">
              <div className="settings-field">
                <label className="settings-label">Color Theme</label>
                <select className="input-field" defaultValue="Light">
                  <option value="Light">DefectLens Standard (Dark Navy Sidebar + Crisp Light Cards)</option>
                  <option value="HighContrast">High Contrast Academic Audit</option>
                </select>
              </div>

              <div className="settings-field">
                <label className="settings-label">Data Visualization Palette</label>
                <select className="input-field" defaultValue="Default">
                  <option value="Default">Cobalt Blue &amp; Emerald Green (Accessible)</option>
                  <option value="Viridis">Viridis Colorblind-Safe</option>
                  <option value="Thermal">Spectral Defect Risk Thermal</option>
                </select>
              </div>

              <div className="settings-field">
                <label className="settings-label">Dashboard Information Density</label>
                <select className="input-field" defaultValue="Comfortable">
                  <option value="Comfortable">Comfortable (Recommended for Viva Presentation)</option>
                  <option value="Compact">Compact (High Information Density)</option>
                </select>
              </div>
            </div>

            <div className="settings-footer-actions">
              <button onClick={handleSave} className="btn btn-primary" style={{ padding: "6px 14px", fontSize: "12px" }}>
                <Save size={14} /> Save Appearance
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}