"""
Comprehensive End-to-End Integration Test for X-Defect Platform
Validates ML Training, Calibration, SHAP XAI, KS/PSI Shift Engine, OOD Mahalanobis, and What-If Refactoring.
"""
import asyncio
import os
import sys

# Ensure workspace root is in sys.path when run directly
WORKSPACE_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if WORKSPACE_ROOT not in sys.path:
    sys.path.insert(0, WORKSPACE_ROOT)

import httpx
from backend.main import app

async def run_all_tests():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test", timeout=30.0) as client:
        print("\n--- 1. Testing Root & Dataset Listing ---")
        res = await client.get("/")
        assert res.status_code == 200, f"Root failed: {res.text}"
        print("[PASS] Root API status:", res.json()["status"])

        res = await client.get("/datasets/list")
        assert res.status_code == 200, f"Datasets list failed: {res.text}"
        datasets = res.json()["datasets"]
        print(f"[PASS] Found {len(datasets)} datasets:", [d["name"] for d in datasets])

        print("\n--- 2. Testing Model Training (Random Forest on JM1 with Calibration) ---")
        train_payload = {
            "dataset_name": "jm1",
            "algorithm": "random_forest",
            "calibrate": True
        }
        res = await client.post("/models/train", json=train_payload)
        assert res.status_code == 200, f"Train failed: {res.text}"
        train_data = res.json()
        metrics = train_data["metadata"]["val_metrics"]
        print(f"[PASS] Model trained! F1 Score: {metrics['f1_score']}, PR-AUC: {metrics['pr_auc']}, Brier: {metrics['brier_score']}")

        print("\n--- 3. Testing Single Module Prediction & Reliability Layer ---")
        pred_payload = {
            "module_id": "PaymentService.java",
            "features": {
                "loc": 180.0,
                "v_g": 18.0,
                "ev_g": 9.0,
                "iv_g": 12.0,
                "n": 450.0,
                "v": 2800.0,
                "l": 0.05,
                "d": 20.0,
                "i": 140.0,
                "e": 56000.0,
                "b": 0.93,
                "t": 3111.0,
                "lOCode": 140.0,
                "lOComment": 20.0,
                "lOBlank": 20.0,
                "locCodeAndComment": 5.0,
                "uniq_Op": 28.0,
                "uniq_Opnd": 45.0,
                "total_Op": 270.0,
                "total_Opnd": 180.0,
                "branchCount": 35.0
            },
            "include_lime": True
        }
        res = await client.post("/predict/single", json=pred_payload)
        assert res.status_code == 200, f"Prediction failed: {res.text}"
        pred_res = res.json()
        print(f"[PASS] Prediction: {pred_res['prediction']} (Probability: {pred_res['probability']:.1%})")
        print(f"[PASS] Reliability Status: {pred_res['reliability']['reliability_status']} ({pred_res['reliability']['reliability_score']}%)")
        print(f"[PASS] Mahalanobis OOD: {pred_res['ood_analysis']['status']} (Dist: {pred_res['ood_analysis']['mahalanobis_distance']})")
        print(f"[PASS] Top SHAP Risk Factor: {pred_res['shap_explanation']['top_risk_factors'][0]['feature']} (+{pred_res['shap_explanation']['top_risk_factors'][0]['contribution']})")

        print("\n--- 4. Testing What-If Refactoring Simulation ---")
        mod_features = dict(pred_payload["features"])
        mod_features["v_g"] = 4.0      # Reduced complexity from 18 to 4
        mod_features["loc"] = 45.0     # Refactored lines of code from 180 to 45
        mod_features["e"] = 8000.0     # Halstead effort reduction

        what_if_res = await client.post("/explain/what-if", json={
            "base_features": pred_payload["features"],
            "modified_features": mod_features
        })
        assert what_if_res.status_code == 200, f"What-If failed: {what_if_res.text}"
        wi_data = what_if_res.json()
        print(f"[PASS] What-If Counterfactual: Risk reduced by {wi_data['delta_percentage_points']}% points ({wi_data['original_probability']:.1%} -> {wi_data['modified_probability']:.1%})")

        print("\n--- 5. Testing Dataset Shift Engine (JM1 vs Project_Shifted_2026) ---")
        shift_res = await client.post("/shift/analyze", json={"target_dataset": "project_shifted_2026"})
        assert shift_res.status_code == 200, f"Shift analysis failed: {shift_res.text}"
        shift_data = shift_res.json()["results"]
        print(f"[PASS] Shift Severity: {shift_data['overall_shift_severity']} ({shift_data['badge']})")
        print(f"[PASS] Shifted Features: {shift_data['shifted_features_count']} / {shift_data['total_features']}")
        print(f"[PASS] OOD Fraction: {shift_data['ood_summary']['ood_percentage']}%")
        print(f"[PASS] Retraining Recommendation: {shift_data['retraining_recommendation']['urgency']}")

        print("\n--- 6. Testing Cross-Project Domain Transfer ---")
        cross_res = await client.post("/models/cross-project-evaluation", json={
            "source_dataset": "jm1",
            "target_datasets": ["kc1", "kc2", "pc1", "project_shifted_2026"],
            "algorithm": "random_forest"
        })
        assert cross_res.status_code == 200, f"Cross-project eval failed: {cross_res.text}"
        cross_data = cross_res.json()["results"]
        print(f"[PASS] Evaluated {len(cross_data)} domains:")
        for d in cross_data:
            print(f"       -> {d['target_project']}: F1={d['f1_score']}, Drop={d.get('f1_drop_pct', 0)}%, Status={d['status']}")

        print("\n==========================================")
        print("ALL CORE BACKEND ENGINES VALIDATED AND FUNCTIONAL!")
        print("==========================================\n")

if __name__ == "__main__":
    asyncio.run(run_all_tests())
