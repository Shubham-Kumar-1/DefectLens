"""
Main FastAPI Application Entrypoint for DefectLens (X-Defect)
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
import pandas as pd

from .routes import datasets, training, prediction, shift, explanation, reports
from .ml.models import model_manager
from .xai.shap_explainer import shap_explainer
from .xai.lime_explainer import lime_explainer
from .shift.shift_engine import shift_engine
from .database.db import init_db

app = FastAPI(
    title="X-Defect: Explainable AI for Software Defect Prediction under Dataset Shift",
    description="Research-grade platform integrating Defect Prediction, SHAP/LIME Explainability, Covariate Shift Testing (KS/PSI), OOD Mahalanobis Detection, and Prediction Reliability Assessment.",
    version="1.0.0"
)

# Enable CORS for React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(datasets.router)
app.include_router(training.router)
app.include_router(prediction.router)
app.include_router(shift.router)
app.include_router(explanation.router)
app.include_router(reports.router)

@app.on_event("startup")
def startup_event():
    init_db()
    
    # Try loading existing model bundle or train default baseline on JM1
    loaded = model_manager.load_active_model()
    if loaded:
        print("[Startup] Loaded existing active model successfully.")
        # Re-initialize background states
        try:
            sample_df = pd.read_csv(os.path.join(os.path.dirname(__file__), "data", "jm1.csv"))
            X_scaled, _, feature_names = model_manager.preprocessor.transform(sample_df)
            shap_explainer.initialize(model_manager.base_estimator, X_scaled, feature_names)
            lime_explainer.initialize(X_scaled, feature_names)
            shift_engine.initialize_baseline(sample_df, feature_names, X_scaled)
        except Exception as e:
            print(f"[Startup] Baseline warm-up note: {e}")
    else:
        print("[Startup] No saved model found. Training initial benchmark model on JM1 (Random Forest)...")
        jm1_path = os.path.join(os.path.dirname(__file__), "data", "jm1.csv")
        if os.path.exists(jm1_path):
            try:
                df = pd.read_csv(jm1_path)
                meta = model_manager.train_model(df, algorithm="random_forest", calibrate=True, dataset_name="jm1")
                X_scaled, _, feature_names = model_manager.preprocessor.transform(df)
                shap_explainer.initialize(model_manager.base_estimator, X_scaled, feature_names)
                lime_explainer.initialize(X_scaled, feature_names)
                shift_engine.initialize_baseline(df, feature_names, X_scaled)
                meta["feature_rankings"] = model_manager.preprocessor.compute_feature_rankings(df)
                print(f"[Startup] Initial JM1 baseline ready! F1 Score: {meta['val_metrics']['f1_score']}")
            except Exception as e:
                print(f"[Startup] Error initializing baseline model: {e}")

@app.get("/")
def root():
    return {
        "platform": "X-Defect (DefectLens)",
        "status": "online",
        "endpoints": [
            "/datasets/list",
            "/models/train",
            "/models/current",
            "/models/cross-project-evaluation",
            "/predict/single",
            "/predict/batch",
            "/shift/analyze",
            "/shift/feature-distribution",
            "/explain/global",
            "/explain/what-if",
            "/reports/export-html"
        ]
    }
