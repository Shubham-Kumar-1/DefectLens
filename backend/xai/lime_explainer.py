"""
LIME Explainer Module for Tabular Defect Prediction
Generates local rule-based feature contributions and surrogate linear model weights.
"""
from lime.lime_tabular import LimeTabularExplainer
import numpy as np
from typing import Dict, Any, List

class DefectLimeExplainer:
    def __init__(self):
        self.explainer = None
        self.feature_names = []
        self.is_initialized = False

    def initialize(self, X_train_scaled: np.ndarray, feature_names: List[str]):
        """Initialize LIME tabular explainer."""
        self.feature_names = feature_names
        self.explainer = LimeTabularExplainer(
            training_data=X_train_scaled,
            feature_names=feature_names,
            class_names=["Clean", "Defective"],
            mode="classification",
            random_state=42
        )
        self.is_initialized = True

    def explain_instance(self, x_scaled: np.ndarray, model, num_features: int = 6) -> Dict[str, Any]:
        if not self.is_initialized:
            raise ValueError("LIME explainer is not initialized.")

        predict_fn = lambda x: model.predict_proba(x)
        exp = self.explainer.explain_instance(
            data_row=x_scaled,
            predict_fn=predict_fn,
            num_features=num_features,
            labels=(1,)
        )

        explanation_list = exp.as_list(label=1)
        rules = []
        for rule, weight in explanation_list:
            rules.append({
                "rule": rule,
                "weight": round(float(weight), 4),
                "direction": "INCREASES_DEFECT_RISK" if weight > 0 else "REDUCES_DEFECT_RISK"
            })

        return {
            "method": "LIME",
            "score": round(float(exp.score), 4),
            "intercept": round(float(exp.intercept[1]), 4) if hasattr(exp, 'intercept') and len(exp.intercept) > 1 else 0.5,
            "rules": rules
        }

lime_explainer = DefectLimeExplainer()
