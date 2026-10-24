"""
ML Model Training, Calibration, and Registry Module
Supports Logistic Regression, Random Forest, XGBoost with probability calibration.
"""
import os
import joblib
import pandas as pd
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.calibration import CalibratedClassifierCV
from sklearn.model_selection import train_test_split
from xgboost import XGBClassifier

from .preprocessing import DefectPreprocessor
from .evaluation import evaluate_classification

MODEL_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "saved_models")
os.makedirs(MODEL_DIR, exist_ok=True)

class DefectModelManager:
    def __init__(self):
        self.active_model = None
        self.preprocessor = None
        self.model_metadata = {}
        self.baseline_stats = {}
        self.raw_train_df = None

    def build_estimator(self, algorithm: str):
        algo = algorithm.lower()
        if algo == "xgboost":
            return XGBClassifier(
                n_estimators=120,
                max_depth=4,
                learning_rate=0.08,
                subsample=0.85,
                colsample_bytree=0.85,
                random_state=42,
                eval_metric="logloss"
            )
        elif algo == "random_forest":
            return RandomForestClassifier(
                n_estimators=150,
                max_depth=10,
                min_samples_split=4,
                class_weight="balanced",
                random_state=42
            )
        elif algo == "logistic_regression":
            return LogisticRegression(
                max_iter=1000,
                class_weight="balanced",
                random_state=42
            )
        else:
            raise ValueError(f"Unsupported algorithm: {algorithm}. Use 'random_forest', 'xgboost', or 'logistic_regression'.")

    def train_model(self, df: pd.DataFrame, algorithm: str = "random_forest", calibrate: bool = True, dataset_name: str = "custom"):
        """Train and optionally calibrate model, storing baseline distribution metrics."""
        self.raw_train_df = df.copy()
        self.preprocessor = DefectPreprocessor(target_col="defect")
        
        # Fit preprocessor
        self.preprocessor.fit(df)
        X, y, feature_names = self.preprocessor.transform(df)

        if len(np.unique(y)) < 2:
            raise ValueError("Training dataset must contain both defective and non-defective samples.")

        X_train, X_val, y_train, y_val = train_test_split(
            X, y, test_size=0.25, random_state=42, stratify=y
        )

        base_estimator = self.build_estimator(algorithm)
        
        # Train base model
        base_estimator.fit(X_train, y_train)

        # Calibration
        if calibrate:
            try:
                from sklearn.frozen import FrozenEstimator
                calibrator = CalibratedClassifierCV(estimator=FrozenEstimator(base_estimator), method='sigmoid')
            except ImportError:
                calibrator = CalibratedClassifierCV(estimator=base_estimator, method='sigmoid', cv='prefit')
            calibrator.fit(X_val, y_val)
            final_model = calibrator
        else:
            final_model = base_estimator

        # Validation evaluation
        y_prob = final_model.predict_proba(X_val)[:, 1]
        y_pred = (y_prob >= 0.5).astype(int)
        val_metrics = evaluate_classification(y_val, y_pred, y_prob)

        # Baseline distribution statistics for shift monitoring
        self.baseline_stats = {}
        for col in feature_names:
            series = pd.to_numeric(df[col], errors='coerce').dropna()
            self.baseline_stats[col] = {
                "mean": round(float(series.mean()), 4),
                "std": round(float(series.std()), 4),
                "median": round(float(series.median()), 4),
                "p25": round(float(series.quantile(0.25)), 4),
                "p75": round(float(series.quantile(0.75)), 4),
                "min": round(float(series.min()), 4),
                "max": round(float(series.max()), 4),
                "values": series.sample(min(300, len(series)), random_state=42).tolist()
            }

        # Feature importance from base estimator if available
        feature_importance = []
        if hasattr(base_estimator, "feature_importances_"):
            importances = base_estimator.feature_importances_
            for name, imp in zip(feature_names, importances):
                feature_importance.append({"feature": name, "importance": round(float(imp), 4)})
            feature_importance.sort(key=lambda x: x["importance"], reverse=True)
        elif hasattr(base_estimator, "coef_"):
            coefs = np.abs(base_estimator.coef_[0])
            for name, imp in zip(feature_names, coefs):
                feature_importance.append({"feature": name, "importance": round(float(imp), 4)})
            feature_importance.sort(key=lambda x: x["importance"], reverse=True)

        self.active_model = final_model
        self.base_estimator = base_estimator
        self.model_metadata = {
            "algorithm": algorithm,
            "dataset_name": dataset_name,
            "calibrated": calibrate,
            "feature_names": feature_names,
            "val_metrics": val_metrics,
            "feature_importance": feature_importance,
            "training_samples": len(df),
            "baseline_defect_rate": round(float(np.mean(y)), 4)
        }

        # Save model package
        self.save_active_model()
        return self.model_metadata

    def predict(self, df_input: pd.DataFrame):
        if self.active_model is None or self.preprocessor is None:
            raise ValueError("No active model loaded.")

        X_scaled, _, _ = self.preprocessor.transform(df_input, include_target=False)
        probabilities = self.active_model.predict_proba(X_scaled)[:, 1]
        predictions = (probabilities >= 0.5).astype(int)

        return predictions, probabilities, X_scaled

    def save_active_model(self, filename: str = "current_model.joblib"):
        path = os.path.join(MODEL_DIR, filename)
        joblib.dump({
            "model": self.active_model,
            "base_estimator": self.base_estimator,
            "preprocessor": self.preprocessor,
            "metadata": self.model_metadata,
            "baseline_stats": self.baseline_stats
        }, path)

    def load_active_model(self, filename: str = "current_model.joblib"):
        path = os.path.join(MODEL_DIR, filename)
        if not os.path.exists(path):
            return False
        bundle = joblib.load(path)
        self.active_model = bundle["model"]
        self.base_estimator = bundle.get("base_estimator", self.active_model)
        self.preprocessor = bundle["preprocessor"]
        self.model_metadata = bundle["metadata"]
        self.baseline_stats = bundle["baseline_stats"]
        return True

model_manager = DefectModelManager()
