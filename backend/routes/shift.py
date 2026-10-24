"""
Dataset Shift Analysis Routes
Implements KS 2-sample tests, PSI, OOD Mahalanobis scoring, Explanation Drift,
and Automated Retraining Recommendations.
"""
from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
import pandas as pd
import numpy as np
import os
from typing import Optional

from ..ml.models import model_manager
from ..shift.shift_engine import shift_engine
from ..xai.shap_explainer import shap_explainer

router = APIRouter(prefix="/shift", tags=["shift"])
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")

class ShiftAnalyzeRequest(BaseModel):
    target_dataset: str = "project_shifted_2026"

@router.post("/analyze")
def analyze_dataset_shift_endpoint(req: ShiftAnalyzeRequest):
    if model_manager.active_model is None or not shift_engine.baseline_stats:
        raise HTTPException(status_code=400, detail="No active model baseline initialized. Train a model first.")

    target_file = f"{req.target_dataset.lower()}.csv" if not req.target_dataset.endswith(".csv") else req.target_dataset
    path = os.path.join(DATA_DIR, target_file)
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail=f"Target dataset {req.target_dataset} not found.")

    df_target = pd.read_csv(path)
    feature_names = model_manager.model_metadata["feature_names"]

    # Transform target features using the saved baseline preprocessor (preventing leakage!)
    X_scaled_target, _, _ = model_manager.preprocessor.transform(df_target, include_target=False)

    # Baseline global SHAP importance
    baseline_importance = {item["feature"]: item["importance"] for item in model_manager.model_metadata.get("feature_importance", [])}
    
    # Compute target sample SHAP importance for Explanation Drift
    target_importance = {}
    if shap_explainer.is_initialized:
        try:
            target_importance = shap_explainer.compute_global_importance(X_scaled_target)
        except Exception:
            target_importance = baseline_importance

    # Run shift engine
    shift_results = shift_engine.analyze_dataset_shift(
        current_df=df_target,
        feature_names=feature_names,
        X_scaled_current=X_scaled_target,
        baseline_importance=baseline_importance,
        current_importance=target_importance
    )

    return {
        "status": "SUCCESS",
        "baseline_dataset": model_manager.model_metadata.get("dataset_name", "JM1").upper(),
        "target_dataset": req.target_dataset.upper(),
        "total_target_samples": len(df_target),
        "results": shift_results
    }

@router.get("/feature-distribution")
def get_feature_distribution(feature: str, target_dataset: str = "project_shifted_2026"):
    """Returns histogram bins for baseline and target dataset for interactive visual comparison."""
    if model_manager.active_model is None or not shift_engine.baseline_stats:
        raise HTTPException(status_code=400, detail="No baseline initialized.")

    if feature not in shift_engine.baseline_stats:
        raise HTTPException(status_code=404, detail=f"Feature {feature} not found in model features.")

    target_file = f"{target_dataset.lower()}.csv" if not target_dataset.endswith(".csv") else target_dataset
    path = os.path.join(DATA_DIR, target_file)
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail=f"Target dataset not found.")

    df_target = pd.read_csv(path)
    if feature not in df_target.columns:
        raise HTTPException(status_code=404, detail=f"Feature {feature} not in target dataset.")

    b_vals = shift_engine.baseline_stats[feature]["values"]
    c_vals = pd.to_numeric(df_target[feature], errors='coerce').dropna().values

    # Determine global min and max for aligned binning
    min_v = float(min(np.min(b_vals), np.min(c_vals)))
    max_v = float(max(np.max(b_vals), np.max(c_vals)))
    
    bins = np.linspace(min_v, max_v, 15)
    b_counts, bin_edges = np.histogram(b_vals, bins=bins, density=True)
    c_counts, _ = np.histogram(c_vals, bins=bins, density=True)

    distribution_data = []
    for i in range(len(b_counts)):
        mid = round(float((bin_edges[i] + bin_edges[i+1]) / 2.0), 2)
        distribution_data.append({
            "bin_label": f"{round(bin_edges[i], 1)} - {round(bin_edges[i+1], 1)}",
            "bin_midpoint": mid,
            "baseline_density": round(float(b_counts[i]), 5),
            "target_density": round(float(c_counts[i]), 5)
        })

    return {
        "feature": feature,
        "baseline_name": model_manager.model_metadata.get("dataset_name", "JM1").upper(),
        "target_name": target_dataset.upper(),
        "baseline_mean": round(float(np.mean(b_vals)), 2),
        "target_mean": round(float(np.mean(c_vals)), 2),
        "distribution_data": distribution_data
    }
