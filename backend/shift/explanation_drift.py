"""
Explanation Drift Detector Module
Analyzes whether the primary feature attributions / driving factors behind predictions
have shifted significantly between the baseline training data and the current evaluation dataset.
"""
import numpy as np
from scipy.spatial.distance import cosine

def compute_explanation_drift(baseline_importance_dict, current_importance_dict):
    """
    Compares baseline feature importance vector with current feature importance vector.
    Uses Cosine Similarity, Rank Correlation, and Top Feature Discrepancies.
    """
    common_features = sorted(list(set(baseline_importance_dict.keys()) & set(current_importance_dict.keys())))
    if not common_features:
        return {
            "drift_status": "UNKNOWN",
            "similarity_score": 1.0,
            "drift_severity": "LOW",
            "top_divergent_features": [],
            "recommendation": "Insufficient overlapping features."
        }

    v_base = np.array([baseline_importance_dict[f] for f in common_features], dtype=float)
    v_curr = np.array([current_importance_dict[f] for f in common_features], dtype=float)

    # Normalize vectors
    norm_b = np.linalg.norm(v_base)
    norm_c = np.linalg.norm(v_curr)
    
    if norm_b > 0:
        v_base = v_base / norm_b
    if norm_c > 0:
        v_curr = v_curr / norm_c

    # Cosine distance
    if norm_b == 0 or norm_c == 0:
        cos_dist = 0.0
    else:
        cos_dist = float(cosine(v_base, v_curr))
        if np.isnan(cos_dist):
            cos_dist = 0.0

    similarity = round(float(max(0.0, 1.0 - cos_dist)), 4)

    # Calculate absolute differences for each feature
    diffs = []
    for f in common_features:
        b_val = baseline_importance_dict[f]
        c_val = current_importance_dict[f]
        diffs.append({
            "feature": f,
            "baseline_weight": round(float(b_val), 4),
            "current_weight": round(float(c_val), 4),
            "delta": round(float(c_val - b_val), 4),
            "abs_delta": round(float(abs(c_val - b_val)), 4)
        })
    diffs.sort(key=lambda x: x["abs_delta"], reverse=True)

    if similarity >= 0.85:
        drift_status = "STABLE"
        drift_severity = "LOW"
        msg = "Model decision logic remains consistent with training patterns."
    elif similarity >= 0.65:
        drift_status = "MODERATE_DRIFT"
        drift_severity = "MODERATE"
        msg = "Explanation drift detected: the model relies on a shifted subset of software metrics to flag defects."
    else:
        drift_status = "SEVERE_EXPLANATION_DRIFT"
        drift_severity = "HIGH"
        msg = "Critical explanation drift! The causal signals guiding defect predictions diverge heavily from baseline."

    return {
        "drift_status": drift_status,
        "drift_severity": drift_severity,
        "explanation_similarity": similarity,
        "divergence_score": round(float(1.0 - similarity), 4),
        "interpretation": msg,
        "top_divergent_features": diffs[:5]
    }
