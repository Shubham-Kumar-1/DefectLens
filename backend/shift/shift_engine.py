"""
Master Dataset Shift Engine
Aggregates KS-tests, PSI metrics, OOD detection, Prior Probability Shift, and Retraining Recommendations.
"""
import pandas as pd
import numpy as np
from typing import Dict, Any, List

from .ks_test import compute_ks_test
from .psi import compute_psi
from .ood import OODDetector
from .explanation_drift import compute_explanation_drift

class DatasetShiftEngine:
    def __init__(self):
        self.ood_detector = OODDetector()
        self.baseline_stats = {}
        self.baseline_raw = None

    def initialize_baseline(self, baseline_df: pd.DataFrame, feature_names: List[str], X_scaled_train: np.ndarray):
        """Fit OOD detector on baseline training data and cache reference values."""
        self.baseline_raw = baseline_df.copy()
        self.ood_detector.fit(X_scaled_train)
        
        self.baseline_stats = {}
        for col in feature_names:
            if col in baseline_df.columns:
                series = pd.to_numeric(baseline_df[col], errors='coerce').dropna()
                self.baseline_stats[col] = {
                    "mean": float(series.mean()),
                    "std": float(series.std()),
                    "values": series.values
                }

    def analyze_dataset_shift(
        self,
        current_df: pd.DataFrame,
        feature_names: List[str],
        X_scaled_current: np.ndarray,
        baseline_importance: Dict[str, float] = None,
        current_importance: Dict[str, float] = None
    ) -> Dict[str, Any]:
        """Performs full distribution comparison between baseline and current dataset."""
        if not self.baseline_stats:
            raise ValueError("Baseline dataset stats not initialized in Shift Engine.")

        feature_shifts = []
        shifted_features_count = 0
        high_psi_features_count = 0
        total_ks_stat_sum = 0.0

        for col in feature_names:
            if col not in self.baseline_stats or col not in current_df.columns:
                continue

            b_vals = self.baseline_stats[col]["values"]
            c_vals = pd.to_numeric(current_df[col], errors='coerce').dropna().values

            ks_res = compute_ks_test(b_vals, c_vals)
            psi_res = compute_psi(b_vals, c_vals)

            is_shifted = ks_res["is_shifted"] or (psi_res["psi"] >= 0.20)
            if is_shifted:
                shifted_features_count += 1
            if psi_res["psi"] >= 0.25:
                high_psi_features_count += 1

            total_ks_stat_sum += ks_res["statistic"]

            feature_shifts.append({
                "feature": col,
                "ks_statistic": ks_res["statistic"],
                "ks_p_value": ks_res["p_value"],
                "ks_severity": ks_res["severity"],
                "psi": psi_res["psi"],
                "psi_status": psi_res["status"],
                "is_shifted": is_shifted,
                "baseline_mean": ks_res["baseline_mean"],
                "current_mean": ks_res["current_mean"],
                "mean_delta_pct": ks_res["mean_delta_pct"],
                "distribution_samples": {
                    "baseline": [float(x) for x in np.random.choice(b_vals, min(80, len(b_vals)), replace=False)],
                    "current": [float(x) for x in np.random.choice(c_vals, min(80, len(c_vals)), replace=False)]
                }
            })

        # Sort features by shift severity (KS stat descending)
        feature_shifts.sort(key=lambda x: x["ks_statistic"], reverse=True)

        # Compute Out-of-Distribution metrics
        ood_results = self.ood_detector.score_batch(X_scaled_current)

        # Prior probability shift check if target exists
        prior_shift = None
        if "defect" in current_df.columns and "defect" in self.baseline_raw.columns:
            base_rate = float(self.baseline_raw["defect"].mean())
            curr_rate = float(current_df["defect"].mean())
            prior_delta = curr_rate - base_rate
            prior_shift = {
                "baseline_defect_rate": round(base_rate, 4),
                "current_defect_rate": round(curr_rate, 4),
                "delta": round(prior_delta, 4),
                "status": "SHIFT_DETECTED" if abs(prior_delta) >= 0.08 else "STABLE"
            }

        # Overall Covariate Shift Status
        n_features = len(feature_shifts)
        shift_ratio = shifted_features_count / max(1, n_features)
        avg_ks = total_ks_stat_sum / max(1, n_features)

        if shift_ratio < 0.20 and avg_ks < 0.15 and ood_results["ood_percentage"] < 8.0:
            overall_shift = "LOW"
            shift_badge = "Stable Environment"
            shift_color = "emerald"
        elif shift_ratio < 0.50 or avg_ks < 0.30 or ood_results["ood_percentage"] < 20.0:
            overall_shift = "MODERATE"
            shift_badge = "Moderate Distribution Shift"
            shift_color = "amber"
        else:
            overall_shift = "HIGH"
            shift_badge = "Severe Dataset Shift"
            shift_color = "rose"

        # Explanation Drift if weights provided
        explanation_drift_res = None
        if baseline_importance and current_importance:
            explanation_drift_res = compute_explanation_drift(baseline_importance, current_importance)

        # Automated Retraining Recommendation
        recommendation = self._generate_retraining_recommendation(
            overall_shift=overall_shift,
            shift_ratio=shift_ratio,
            ood_fraction=ood_results["ood_fraction"],
            top_shifted=[f["feature"] for f in feature_shifts[:3] if f["is_shifted"]],
            prior_shift=prior_shift,
            explanation_drift_res=explanation_drift_res
        )

        return {
            "overall_shift_severity": overall_shift,
            "badge": shift_badge,
            "color": shift_color,
            "total_features": n_features,
            "shifted_features_count": shifted_features_count,
            "shift_ratio": round(shift_ratio, 3),
            "average_ks_statistic": round(avg_ks, 4),
            "ood_summary": ood_results,
            "prior_probability_shift": prior_shift,
            "explanation_drift": explanation_drift_res,
            "feature_shifts": feature_shifts,
            "retraining_recommendation": recommendation
        }

    def _generate_retraining_recommendation(
        self, overall_shift: str, shift_ratio: float, ood_fraction: float,
        top_shifted: List[str], prior_shift: Any, explanation_drift_res: Any
    ):
        reasons = []
        if overall_shift == "HIGH":
            reasons.append(f"{int(shift_ratio * 100)}% of software metrics exhibit statistically significant distribution change.")
        if ood_fraction > 0.15:
            reasons.append(f"{int(ood_fraction * 100)}% of incoming modules are Out-of-Distribution anomalies (Mahalanobis distance > p95).")
        if top_shifted:
            reasons.append(f"Key defect predictors strongly shifted: {', '.join(top_shifted)}.")
        if prior_shift and prior_shift["status"] == "SHIFT_DETECTED":
            reasons.append(f"Defect base rate drifted from {prior_shift['baseline_defect_rate']:.1%} to {prior_shift['current_defect_rate']:.1%}.")
        if explanation_drift_res and explanation_drift_res.get("drift_severity") == "HIGH":
            reasons.append("Model decision logic has experienced Severe Explanation Drift.")

        if overall_shift == "HIGH" or ood_fraction >= 0.20:
            urgency = "URGENT_RETRAINING_RECOMMENDED"
            action = "Re-train the model with recent labeled modules from the target system. Predictions on current modules should be audited manually."
        elif overall_shift == "MODERATE" or ood_fraction >= 0.10:
            urgency = "MONITOR_AND_SCHEDULE_UPDATE"
            action = "Flag predictions for developer verification. Collect recent test and bug data to calibrate an incremental update."
        else:
            urgency = "MODEL_HEALTHY"
            action = "Distribution remains well aligned with training conditions. Automated predictions are reliable."

        return {
            "urgency": urgency,
            "action_advice": action,
            "contributing_factors": reasons if reasons else ["Feature distributions remain statistically consistent."]
        }

shift_engine = DatasetShiftEngine()
