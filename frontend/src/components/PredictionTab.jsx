import React, { useState } from "react";
import { CheckCircle, ShieldAlert, Sparkles, Compass, FileCode, Link, Upload } from "lucide-react";
import { api } from "../services/api";

const PRESETS = {
  highRiskShifted: {
    name: "Legacy Monolith / Extreme Shift (High Defect)",
    values: {
      loc: 380.0, v_g: 34.0, ev_g: 18.0, iv_g: 22.0, n: 820.0, v: 5400.0, l: 0.02, d: 45.0,
      i: 120.0, e: 243000.0, b: 1.8, t: 13500.0, lOCode: 290.0, lOComment: 30.0, lOBlank: 60.0,
      locCodeAndComment: 8.0, uniq_Op: 42.0, uniq_Opnd: 75.0, total_Op: 500.0, total_Opnd: 320.0, branchCount: 67.0
    }
  },
  moderateRisk: {
    name: "Typical Service Module (Borderline)",
    values: {
      loc: 110.0, v_g: 9.0, ev_g: 4.0, iv_g: 6.0, n: 240.0, v: 1400.0, l: 0.08, d: 12.0,
      i: 116.0, e: 16800.0, b: 0.46, t: 933.0, lOCode: 85.0, lOComment: 15.0, lOBlank: 10.0,
      locCodeAndComment: 2.0, uniq_Op: 18.0, uniq_Opnd: 28.0, total_Op: 140.0, total_Opnd: 100.0, branchCount: 17.0
    }
  },
  cleanModule: {
    name: "Refactored Utility (Low Defect)",
    values: {
      loc: 28.0, v_g: 2.0, ev_g: 1.0, iv_g: 1.0, n: 55.0, v: 280.0, l: 0.25, d: 4.0,
      i: 70.0, e: 1120.0, b: 0.09, t: 62.0, lOCode: 22.0, lOComment: 4.0, lOBlank: 2.0,
      locCodeAndComment: 0.0, uniq_Op: 7.0, uniq_Opnd: 12.0, total_Op: 32.0, total_Opnd: 23.0, branchCount: 3.0
    }
  }
};

export default function PredictionTab({ _currentModel = null }) {
  const [moduleId, setModuleId] = useState("OrderPaymentProcessor.java");
  const [features, setFeatures] = useState(PRESETS.highRiskShifted.values);
  const [loading, setLoading] = useState(false);
  const [predictionResult, setPredictionResult] = useState(null);
  const [error, setError] = useState(null);

  const [githubUrl, setGithubUrl] = useState("");
  const [analyzingCode, setAnalyzingCode] = useState(false);
  const [codeSnippet, setCodeSnippet] = useState("");
  const [showCodeSnippetBox, setShowCodeSnippetBox] = useState(false);
  const [extractedMeta, setExtractedMeta] = useState(null);
  const [showAllFeatures, setShowAllFeatures] = useState(false);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      await processCode(evt.target.result, file.name);
    };
    reader.readAsText(file);
  };

  const handleGithubImport = async () => {
    if (!githubUrl) return;
    setAnalyzingCode(true);
    setError(null);
    try {
      const filename = githubUrl.split("/").pop() || "github_script.py";
      setModuleId(filename);
      const res = await api.analyzeCode({ url: githubUrl, filename });
      if (res.features) {
        setFeatures(prev => ({ ...prev, ...res.features }));
      }
      if (res.metadata) {
        setExtractedMeta(res.metadata);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setAnalyzingCode(false);
    }
  };

  const processCode = async (code, filename = "custom_module.py") => {
    setAnalyzingCode(true);
    setError(null);
    try {
      setModuleId(filename);
      const res = await api.analyzeCode({ code, filename });
      if (res.features) {
        setFeatures(prev => ({ ...prev, ...res.features }));
      }
      if (res.metadata) {
        setExtractedMeta(res.metadata);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setAnalyzingCode(false);
    }
  };

  const handleSnippetAnalyze = async () => {
    if (!codeSnippet.trim()) return;
    await processCode(codeSnippet, moduleId || "PastedSnippet.py");
  };

  const handlePredict = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.predictSingle({
        module_id: moduleId,
        features: features,
        include_lime: true
      });
      setPredictionResult(res);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePresetSelect = (key) => {
    setFeatures(PRESETS[key].values);
    setExtractedMeta(null);
  };

  const updateMetric = (key, val) => {
    setFeatures(prev => ({ ...prev, [key]: parseFloat(val) || 0 }));
  };

  const rel = predictionResult?.reliability;
  const ood = predictionResult?.ood_analysis;
  const shap = predictionResult?.shap_explanation;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header and Quick-Load Presets */}
      <div className="glass-card" style={{ padding: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
          <div>
            <h2 style={{ fontSize: "18px", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px" }}>
              <Compass size={20} color="#3b82f6" /> Module Defect Risk &amp; Reliability Auditor
            </h2>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
              Predicts defect probability, explains contributing factors via SHAP/LIME, and computes the <strong>Confidence vs Reliability</strong> index.
            </p>
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {Object.keys(PRESETS).map(k => (
              <button
                key={k}
                onClick={() => handlePresetSelect(k)}
                className="btn btn-secondary"
                style={{ fontSize: "11px", padding: "6px 10px" }}
              >
                {PRESETS[k].name}
              </button>
            ))}
          </div>
        </div>

        {/* Upload / GitHub Import / Code Snippet */}
        <div style={{ marginTop: "24px", padding: "16px", borderRadius: "8px", background: "rgba(255,255,255,0.03)", border: "1px dashed var(--border-subtle)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
            <h3 style={{ fontSize: "14px", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px" }}>
              <FileCode size={16} color="#3b82f6" /> Extract Metrics from Source Code (Python, Java, JS, C/C++, C#, etc.)
            </h3>
            <button
              onClick={() => setShowCodeSnippetBox(!showCodeSnippetBox)}
              className="btn btn-secondary"
              style={{ fontSize: "11px", padding: "4px 10px" }}
            >
              {showCodeSnippetBox ? "Hide Code Box" : "Paste Code Directly"}
            </button>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, minWidth: "250px" }}>
              <Link size={18} color="var(--text-secondary)" />
              <input 
                type="text" 
                className="input-field" 
                placeholder="Paste GitHub file URL (e.g., https://github.com/user/repo/blob/main/file.py)" 
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                style={{ flex: 1 }}
              />
              <button onClick={handleGithubImport} disabled={analyzingCode || !githubUrl} className="btn btn-secondary" style={{ padding: "8px 12px" }}>
                {analyzingCode ? "Fetching..." : "Import"}
              </button>
            </div>
            
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "600" }}>OR</span>
              <label className="btn btn-secondary" style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
                <Upload size={14} /> Upload File
                <input type="file" onChange={handleFileUpload} style={{ display: "none" }} accept=".py,.js,.jsx,.ts,.tsx,.java,.cpp,.c,.cs,.go" />
              </label>
            </div>
          </div>

          {/* Paste Code Box */}
          {showCodeSnippetBox && (
            <div style={{ marginTop: "14px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <textarea
                className="input-field"
                rows={6}
                placeholder="Paste your source code snippet here (Python, Java, C++, JavaScript, etc.)..."
                value={codeSnippet}
                onChange={(e) => setCodeSnippet(e.target.value)}
                style={{ fontFamily: "monospace", fontSize: "12px", width: "100%", resize: "vertical" }}
              />
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  onClick={handleSnippetAnalyze}
                  disabled={analyzingCode || !codeSnippet.trim()}
                  className="btn btn-primary"
                  style={{ fontSize: "12px", padding: "6px 16px" }}
                >
                  {analyzingCode ? "Extracting..." : "Analyze Pasted Code"}
                </button>
              </div>
            </div>
          )}

          {analyzingCode && (
            <div style={{ fontSize: "12px", color: "#3b82f6", marginTop: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Sparkles size={14} /> Parsing AST &amp; calculating Halstead/McCabe complexity metrics...
            </div>
          )}

          {/* Extracted Metrics Confirmation Banner */}
          {extractedMeta && (
            <div style={{ marginTop: "14px", padding: "12px 14px", borderRadius: "6px", background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.25)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <CheckCircle size={16} color="#10b981" />
                  <span style={{ fontSize: "13px", fontWeight: "600", color: "#e2e8f0" }}>
                    Successfully Extracted Metrics from: <span style={{ color: "#38bdf8" }}>{extractedMeta.filename}</span>
                  </span>
                  <span className="badge badge-blue" style={{ fontSize: "10px", textTransform: "uppercase" }}>
                    {extractedMeta.detected_language} ({extractedMeta.method === "radon_ast" ? "AST Radon" : "Static Parser"})
                  </span>
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-secondary)", display: "flex", gap: "12px" }}>
                  <span>LOC: <strong>{extractedMeta.total_lines}</strong></span>
                  <span>SLOC: <strong>{extractedMeta.executable_code_lines}</strong></span>
                  <span>v(g): <strong>{extractedMeta.cyclomatic_complexity}</strong></span>
                  <span>Effort: <strong>{Math.round(extractedMeta.halstead_effort)}</strong></span>
                </div>
              </div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "6px" }}>
                All 21 NASA MDP software metrics (McCabe paths, Halstead operands/operators, volume, effort, and bug estimates) have been computed and synchronized.
              </div>
            </div>
          )}
        </div>

        {/* Input Parameters Form - Key Metrics */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "14px", marginTop: "20px" }}>
          <div>
            <label style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: "600", display: "block", marginBottom: "4px" }}>
              MODULE FILENAME
            </label>
            <input
              type="text"
              className="input-field"
              value={moduleId}
              onChange={(e) => setModuleId(e.target.value)}
            />
          </div>

          <div>
            <label style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: "600", display: "block", marginBottom: "4px" }}>
              LINES OF CODE (LOC)
            </label>
            <input
              type="number"
              className="input-field"
              value={features.loc}
              onChange={(e) => updateMetric("loc", e.target.value)}
            />
          </div>

          <div>
            <label style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: "600", display: "block", marginBottom: "4px" }}>
              CYCLOMATIC COMPLEXITY v(g)
            </label>
            <input
              type="number"
              className="input-field"
              value={features.v_g}
              onChange={(e) => updateMetric("v_g", e.target.value)}
            />
          </div>

          <div>
            <label style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: "600", display: "block", marginBottom: "4px" }}>
              DESIGN COMPLEXITY iv(g)
            </label>
            <input
              type="number"
              className="input-field"
              value={features.iv_g}
              onChange={(e) => updateMetric("iv_g", e.target.value)}
            />
          </div>

          <div>
            <label style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: "600", display: "block", marginBottom: "4px" }}>
              BRANCH COUNT
            </label>
            <input
              type="number"
              className="input-field"
              value={features.branchCount}
              onChange={(e) => updateMetric("branchCount", e.target.value)}
            />
          </div>

          <div>
            <label style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: "600", display: "block", marginBottom: "4px" }}>
              HALSTEAD EFFORT (e)
            </label>
            <input
              type="number"
              className="input-field"
              value={features.e}
              onChange={(e) => updateMetric("e", e.target.value)}
            />
          </div>
        </div>

        {/* Toggle View All 21 Extracted Features */}
        <div style={{ marginTop: "14px" }}>
          <button
            onClick={() => setShowAllFeatures(!showAllFeatures)}
            className="btn btn-secondary"
            style={{ fontSize: "11px", padding: "4px 10px" }}
          >
            {showAllFeatures ? "Hide Extended Metrics" : "Inspect All 21 NASA MDP Features"}
          </button>
        </div>

        {showAllFeatures && (
          <div style={{ marginTop: "14px", padding: "16px", borderRadius: "8px", background: "rgba(0,0,0,0.2)", border: "1px solid var(--border-subtle)" }}>
            <div style={{ fontSize: "12px", fontWeight: "600", marginBottom: "12px", color: "var(--text-secondary)" }}>
              Complete 21 Software Metric Vector used by Model:
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "10px" }}>
              {Object.keys(features).map(k => (
                <div key={k} style={{ background: "rgba(255,255,255,0.02)", padding: "8px", borderRadius: "4px", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <label style={{ fontSize: "10px", color: "var(--text-muted)", display: "block", textTransform: "uppercase" }}>{k}</label>
                  <input
                    type="number"
                    step="any"
                    className="input-field"
                    style={{ fontSize: "12px", padding: "4px 6px", marginTop: "2px" }}
                    value={features[k] !== undefined ? features[k] : 0}
                    onChange={(e) => updateMetric(k, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginTop: "18px", display: "flex", justifyContent: "flex-end" }}>
          <button onClick={handlePredict} disabled={loading} className="btn btn-primary" style={{ padding: "10px 24px" }}>
            {loading ? "Evaluating Metrics & Explainability..." : "Predict & Audit Reliability"}
          </button>
        </div>

        {error && (
          <div style={{ marginTop: "14px", padding: "10px", borderRadius: "6px", background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.3)", color: "#fb7185", fontSize: "13px" }}>
            {error}
          </div>
        )}
      </div>

      {/* Prediction Output & Reliability Diagnosis */}
      {predictionResult && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px" }}>
          {/* Defect Probability & Risk */}
          <div className="glass-card" style={{ padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "12px", textTransform: "uppercase", color: "var(--text-secondary)", fontWeight: "600" }}>
                Predicted Defect Risk
              </span>
              <span className={`badge badge-${predictionResult.prediction === "Defective" ? "rose" : "emerald"}`}>
                {predictionResult.prediction}
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "baseline", gap: "12px", marginTop: "12px" }}>
              <span style={{ fontSize: "48px", fontWeight: "800", color: predictionResult.probability >= 0.5 ? "#f43f5e" : "#10b981", letterSpacing: "-0.03em" }}>
                {predictionResult.probability_percentage}%
              </span>
              <span style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
                Defect Probability
              </span>
            </div>

            {/* Risk Bar */}
            <div style={{ width: "100%", height: "8px", background: "rgba(255,255,255,0.08)", borderRadius: "4px", overflow: "hidden", marginTop: "10px", marginBottom: "16px" }}>
              <div style={{ width: `${predictionResult.probability_percentage}%`, height: "100%", background: predictionResult.probability >= 0.5 ? "linear-gradient(90deg, #f59e0b, #ef4444)" : "#10b981" }}></div>
            </div>

            {/* Novel Reliability Layer Card */}
            <div style={{ background: rel?.reliability_warning ? "rgba(244,63,94,0.08)" : "rgba(16,185,129,0.08)", border: `1px solid ${rel?.reliability_warning ? "rgba(244,63,94,0.3)" : "rgba(16,185,129,0.3)"}`, borderRadius: "8px", padding: "16px", marginTop: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <strong style={{ fontSize: "13px", color: rel?.reliability_warning ? "#fb7185" : "#34d399", display: "flex", alignItems: "center", gap: "6px" }}>
                  <ShieldAlert size={16} /> Operational Reliability: {rel?.reliability_score}%
                </strong>
                <span className={`badge badge-${rel?.badge_color || "blue"}`}>{rel?.reliability_badge}</span>
              </div>
              <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: "1.4" }}>
                {rel?.actionable_advice}
              </p>

              {rel?.paradox_note && (
                <div style={{ marginTop: "10px", padding: "8px", borderRadius: "6px", background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)", fontSize: "11px", color: "#fbbf24" }}>
                  <strong>{rel.paradox_note}</strong>
                </div>
              )}
            </div>

            {/* Out-of-Distribution Mahalanobis Breakdown */}
            <div style={{ marginTop: "16px", padding: "12px", borderRadius: "8px", background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-subtle)", fontSize: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-secondary)" }}>
                <span>Mahalanobis OOD Distance:</span>
                <strong style={{ color: ood?.status === "IN_DISTRIBUTION" ? "#34d399" : "#fb7185" }}>{ood?.mahalanobis_distance}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-muted)", marginTop: "4px" }}>
                <span>Baseline p95 Threshold:</span>
                <span>{ood?.threshold_p95}</span>
              </div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "6px" }}>
                {ood?.description}
              </div>
            </div>
          </div>

          {/* Local SHAP & LIME Explanations */}
          <div className="glass-card" style={{ padding: "24px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Sparkles size={18} color="#8b5cf6" /> Why Did AI Make This Prediction? (SHAP Waterfall)
            </h3>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "16px" }}>
              Base prior rate: <code>{(shap?.base_value * 100).toFixed(1)}%</code>. Positive factors (+) increase defect risk; negative factors (-) provide protective stability.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {shap?.all_contributions?.slice(0, 6).map((c) => (
                <div key={c.feature} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontWeight: "600" }}>{c.feature} ({c.actual_value})</span>
                    <span style={{ color: c.contribution > 0 ? "#fb7185" : "#34d399", fontWeight: "700" }}>
                      {c.contribution > 0 ? `+${c.contribution}` : c.contribution}
                    </span>
                  </div>
                  <div style={{ width: "100%", height: "6px", background: "rgba(255,255,255,0.06)", borderRadius: "3px", overflow: "hidden" }}>
                    <div style={{
                      width: `${Math.min(100, Math.abs(c.contribution) * 250)}%`,
                      height: "100%",
                      background: c.contribution > 0 ? "#f43f5e" : "#10b981",
                      marginLeft: c.contribution < 0 ? "auto" : "0"
                    }}></div>
                  </div>
                </div>
              ))}
            </div>

            {/* LIME Rules */}
            {predictionResult.lime_explanation && (
              <div style={{ marginTop: "20px", paddingTop: "16px", borderTop: "1px solid var(--border-subtle)" }}>
                <h4 style={{ fontSize: "13px", fontWeight: "600", marginBottom: "8px", color: "#a78bfa" }}>
                  LIME Surrogate Decision Rules
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {predictionResult.lime_explanation.rules?.slice(0, 3).map((r, i) => (
                    <div key={i} style={{ fontSize: "11px", padding: "6px 10px", borderRadius: "4px", background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)", display: "flex", justifyContent: "space-between" }}>
                      <span><code>{r.rule}</code></span>
                      <strong style={{ color: r.weight > 0 ? "#fb7185" : "#34d399" }}>{r.weight > 0 ? `+${r.weight}` : r.weight}</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
