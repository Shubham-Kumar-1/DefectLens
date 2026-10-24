/**
 * API Service for DefectLens (X-Defect)
 * Communicates with FastAPI backend
 */
const API_BASE = "http://127.0.0.1:8000";

export const api = {
  // Health
  checkHealth: async () => {
    const res = await fetch(`${API_BASE}/`);
    return res.json();
  },

  // Datasets
  getDatasets: async () => {
    const res = await fetch(`${API_BASE}/datasets/list`);
    return res.json();
  },

  inspectDataset: async (name) => {
    const res = await fetch(`${API_BASE}/datasets/${name}/inspect`);
    return res.json();
  },

  uploadDataset: async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${API_BASE}/datasets/upload`, {
      method: "POST",
      body: formData,
    });
    return res.json();
  },

  // Models
  getCurrentModel: async () => {
    const res = await fetch(`${API_BASE}/models/current`);
    return res.json();
  },

  trainModel: async ({ dataset_name, algorithm, calibrate }) => {
    const res = await fetch(`${API_BASE}/models/train`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dataset_name, algorithm, calibrate }),
    });
    return res.json();
  },

  crossProjectEvaluation: async ({ source_dataset, target_datasets, algorithm }) => {
    const res = await fetch(`${API_BASE}/models/cross-project-evaluation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source_dataset, target_datasets, algorithm }),
    });
    return res.json();
  },

  getTemporalHistory: async () => {
    const res = await fetch(`${API_BASE}/models/temporal-history`);
    return res.json();
  },

  // Prediction
  predictSingle: async ({ module_id, features, include_lime }) => {
    const res = await fetch(`${API_BASE}/predict/single`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ module_id, features, include_lime }),
    });
    return res.json();
  },

  analyzeCode: async ({ code, url, filename }) => {
    const res = await fetch(`${API_BASE}/predict/analyze-code`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, url, filename }),
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Analysis failed");
    }
    return res.json();
  },

  getPredictionHistory: async () => {
    const res = await fetch(`${API_BASE}/predict/history`);
    return res.json();
  },

  getStats: async () => {
    const res = await fetch(`${API_BASE}/predict/stats`);
    return res.json();
  },

  getReliabilityMetrics: async () => {
    const res = await fetch(`${API_BASE}/predict/reliability-metrics`);
    return res.json();
  },

  // Shift Engine
  analyzeShift: async (target_dataset) => {
    const res = await fetch(`${API_BASE}/shift/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target_dataset }),
    });
    return res.json();
  },

  getFeatureDistribution: async (feature, target_dataset) => {
    const res = await fetch(`${API_BASE}/shift/feature-distribution?feature=${feature}&target_dataset=${target_dataset}`);
    return res.json();
  },

  // XAI & Explainability
  getGlobalExplanations: async () => {
    const res = await fetch(`${API_BASE}/explain/global`);
    return res.json();
  },

  explainInstance: async ({ module_id, method, features }) => {
    const res = await fetch(`${API_BASE}/explain/instance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ module_id, method, features }),
    });
    return res.json();
  },

  simulateWhatIf: async ({ base_features, modified_features }) => {
    const res = await fetch(`${API_BASE}/explain/what-if`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ base_features, modified_features }),
    });
    return res.json();
  },

  // Reports
  getReportSummary: async (project) => {
    const res = await fetch(`${API_BASE}/reports/summary${project ? `?project=${project}` : ""}`);
    return res.json();
  },

  getExportHtmlUrl: (project) => `${API_BASE}/reports/export-html${project ? `?project=${project}` : ""}`,
  getDownloadSystemPdfUrl: () => `${API_BASE}/reports/download-system-pdf`,
};
