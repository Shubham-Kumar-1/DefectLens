"""
SHAP Explainer Module for Software Defect Prediction
Supports TreeExplainer for Tree-based models (Random Forest, XGBoost) and Kernel/Linear fallback.
Provides Local Explanations, Global Importance, and What-If Counterfactual Simulation.
"""
import shap
import numpy as np
import pandas as pd
from typing import Dict, Any, List

class DefectShapExplainer:
    def __init__(self):
        self.explainer = None
        self.feature_names = []
        self.is_initialized = False

    def initialize(self, base_estimator, background_scaled: np.ndarray, feature_names: List[str]):
        """Initialize SHAP explainer on base trained estimator with background sample."""
        self.feature_names = feature_names
        # Take a reasonable background subset for rapid kernel execution if needed
        bg = background_scaled[:min(100, len(background_scaled))]

        try:
            # TreeExplainer works directly for RandomForestClassifier and XGBClassifier
            self.explainer = shap.TreeExplainer(base_estimator, data=bg, model_output="probability")
        except Exception:
            try:
                self.explainer = shap.TreeExplainer(base_estimator)
            except Exception:
                # Fallback to KernelExplainer with small background
                predict_fn = lambda x: base_estimator.predict_proba(x)[:, 1]
                self.explainer = shap.KernelExplainer(predict_fn, data=bg[:40])

        self.is_initialized = True

    def explain_instance(self, x_scaled: np.ndarray, raw_feature_dict: Dict[str, float] = None) -> Dict[str, Any]:
        """Explain a single software module prediction."""
        if not self.is_initialized:
            raise ValueError("SHAP explainer has not been initialized.")

        x_2d = x_scaled.reshape(1, -1)
        shap_values = self.explainer.shap_values(x_2d)

        # Handle binary classification shapes
        if isinstance(shap_values, list):
            # Class 1 (defect) values
            vals = shap_values[1][0]
        elif len(shap_values.shape) == 3:
            vals = shap_values[0, :, 1]
        elif len(shap_values.shape) == 2:
            vals = shap_values[0]
        else:
            vals = shap_values

        base_val = getattr(self.explainer, "expected_value", 0.5)
        if isinstance(base_val, (list, np.ndarray)):
            base_val = float(base_val[-1])
        else:
            base_val = float(base_val)

        contributions = []
        for i, feat in enumerate(self.feature_names):
            c_val = float(vals[i])
            actual_val = raw_feature_dict.get(feat, None) if raw_feature_dict else None
            contributions.append({
                "feature": feat,
                "contribution": round(c_val, 4),
                "abs_contribution": round(abs(c_val), 4),
                "actual_value": actual_val,
                "direction": "INCREASES_DEFECT_RISK" if c_val > 0 else "REDUCES_DEFECT_RISK",
                "impact_badge": "Risk Factor (+)" if c_val > 0 else "Protective (-)"
            })

        # Sort by absolute impact descending
        contributions.sort(key=lambda x: x["abs_contribution"], reverse=True)

        return {
            "base_value": round(base_val, 4),
            "top_risk_factors": [c for c in contributions if c["contribution"] > 0][:5],
            "top_protective_factors": [c for c in contributions if c["contribution"] < 0][:5],
            "all_contributions": contributions
        }

    def compute_global_importance(self, X_scaled_sample: np.ndarray) -> Dict[str, float]:
        """Compute mean absolute SHAP values across an evaluation batch."""
        if not self.is_initialized:
            return {}

        sample = X_scaled_sample[:min(150, len(X_scaled_sample))]
        shap_values = self.explainer.shap_values(sample)

        if isinstance(shap_values, list):
            vals = shap_values[1]
        elif len(shap_values.shape) == 3:
            vals = shap_values[:, :, 1]
        else:
            vals = shap_values

        mean_abs = np.mean(np.abs(vals), axis=0)
        importance_dict = {}
        for feat, imp in zip(self.feature_names, mean_abs):
            importance_dict[feat] = round(float(imp), 4)

        return importance_dict

    def what_if_analysis(self, base_features: Dict[str, float], modified_features: Dict[str, float], preprocessor, model):
        """Simulate model response to hypothetical code refactoring / metric changes."""
        df_base = pd.DataFrame([base_features])
        df_mod = pd.DataFrame([modified_features])

        X_base_scaled, _, _ = preprocessor.transform(df_base, include_target=False)
        X_mod_scaled, _, _ = preprocessor.transform(df_mod, include_target=False)

        prob_base = float(model.predict_proba(X_base_scaled)[0, 1])
        prob_mod = float(model.predict_proba(X_mod_scaled)[0, 1])
        delta = prob_mod - prob_base

        diff_features = []
        for k in base_features.keys():
            if k in modified_features and base_features[k] != modified_features[k]:
                diff_features.append({
                    "feature": k,
                    "original_value": base_features[k],
                    "modified_value": modified_features[k],
                    "change_pct": round(float(((modified_features[k] - base_features[k]) / (abs(base_features[k]) + 1e-6)) * 100), 1)
                })

        return {
            "original_probability": round(prob_base, 4),
            "modified_probability": round(prob_mod, 4),
            "probability_delta": round(delta, 4),
            "delta_percentage_points": round(delta * 100, 2),
            "outcome_effect": "DEFECT_RISK_REDUCED" if delta < -0.01 else ("DEFECT_RISK_INCREASED" if delta > 0.01 else "NEUTRAL"),
            "modified_inputs": diff_features,
            "disclaimer": "Note: Counterfactual What-If estimation indicates model sensitivity, not causal proof that altering code metrics directly prevents software bugs."
        }

shap_explainer = DefectShapExplainer()
