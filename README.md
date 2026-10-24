# X-Defect: Explainable AI for Software Defect Prediction under Dataset Shift
> **DefectLens Platform** &bull; Final Year B.Tech CSE Capstone &amp; Research Project

An intelligent software engineering platform that predicts software module defect probability, explains predictions using game-theoretic Shapley values (SHAP) and local decision boundaries (LIME), detects covariate/prior distribution shift using statistical hypothesis testing (2-sample Kolmogorov-Smirnov &amp; Population Stability Index), and computes an operational **Prediction Reliability Assessment** under Out-of-Distribution (OOD) conditions.

---

## 1. The Core Scientific Premise
Traditional ML defect prediction models suffer from the **"Confidence &ne; Reliability" paradox**:
- A model trained on 2022 code metrics will output `Defect Probability = 88%` with high statistical confidence on a 2026 release, despite the architecture and complexity having shifted drastically.
- **X-Defect** explicitly decouples model output confidence from real-world reliability by testing incoming feature distributions and Mahalanobis distances before presenting predictions to developers.

---

## 2. System Architecture
```
                         SOFTWARE MODULE DATA
                                   │
                                   ▼
                         ┌───────────────────┐
                         │Feature Extraction │
                         └─────────┬─────────┘
                                   │
                                   ▼
                       ┌───────────────────────┐
                       │ Defect Prediction ML  │
                       │(CalibratedClassifier) │
                       └───────────┬───────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    ▼                             ▼
              Prediction                     Explanation
             Defect Risk                      SHAP & LIME
                    │                             │
                    └──────────────┬──────────────┘
                                   ▼
                         ┌───────────────────┐
                         │Dataset Shift & OOD│
                         │  (KS, PSI, D_M)   │
                         └─────────┬─────────┘
                                   │
                                   ▼
                     ┌───────────────────────────┐
                     │Reliability Assessment     │
                     │  "Confidence != Trust"    │
                     └─────────────┬─────────────┘
                                   │
                                   ▼
                         ┌───────────────────┐
                         │  React Dashboard  │
                         │ & Audit PDF/JSON  │
                         └───────────────────┘
```

---

## 3. Key Components & Features

### Module 1: Defect Prediction & Calibration
- **Algorithms:** Random Forest, XGBoost (Gradient Boosted Trees), Logistic Regression.
- **Sigmoid Calibration (`CalibratedClassifierCV`):** Guarantees output probabilities match observed empirical defect frequency.
- **Imbalance-Aware Metrics:** Prioritizes **Recall for defective modules** and **PR-AUC**, because missing a genuinely buggy module is far costlier than manual inspection of a false positive.

### Module 2: Dual Explainable AI (XAI)
- **SHAP (Shapley Additive Explanations):** TreeExplainer computing exact local contributions and global mean absolute attribution.
- **LIME (Local Interpretable Model-agnostic Explanations):** Generates human-readable surrogate decision rules (e.g., `v_g > 15.0 AND loc <= 120.0`).
- **What-If Counterfactual Lab:** Interactive sliders simulating hypothetical refactorings (e.g., reducing cyclomatic complexity from 24 to 6) to estimate defect risk mitigation.

### Module 3: Dataset Shift Engine & OOD Detection
- **2-Sample Kolmogorov-Smirnov (KS) Test:** Non-parametric statistical hypothesis testing on continuous software metrics.
- **Population Stability Index (PSI):** Quantile-binned drift quantification.
- **Out-of-Distribution (OOD) Detector:** Regularized Mahalanobis Distance ($D_M$) computing distance from the training distribution centroid:
  $$D_M(x) = \sqrt{(x - \mu)^T \Sigma^{-1} (x - \mu)}$$
- **Explanation Drift:** Detects whether the features driving predictions have changed between baseline and deployment.
- **Retraining Recommendation:** Advises engineers when severe shift and OOD fractions mandate model retraining.

### Module 4: Cross-Project Domain Transfer
- Zero-shot cross-project validation: Train on `JM1` (real-time ground system) and test on `KC1`, `KC2`, `PC1`, and `Project_Shifted_2026`.
- Demonstrates empirical **30% to 80% F1 score collapse** under distribution shift, proving why distribution monitoring is mandatory.

---

## 4. Benchmark Datasets Included
- `JM1.csv`: 1200 modules, 19.0% defect rate (NASA Real-time Ground System)
- `KC1.csv`: 850 modules, 15.1% defect rate (C++ Storage Management Subsystem)
- `KC2.csv`: 520 modules, 20.0% defect rate (C++ Science Data Processing)
- `PC1.csv`: 700 modules, 11.0% defect rate (Flight Software in C)
- `Project_Shifted_2026.csv`: 600 modules, 32.0% defect rate (Simulates extreme architectural drift & complexity shift)

---

## 5. Quickstart & Running Locally

### 1. Launch FastAPI Backend
```bash
# From workspace root
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```
The backend initializes the SQLite database, checks baseline models, and exposes REST endpoints at `http://127.0.0.1:8000`.

### 2. Launch React Frontend
```bash
cd frontend
npm run dev
```
Open `http://localhost:5173` in your browser.

### 3. Run Backend Test Suite
```bash
python -m backend.test_api
```
All endpoints and ML pipelines run end-to-end and report passing status.

---

## 6. Viva & Project Defense Guide
1. **Q: Why not just use accuracy?**
   *A:* Defect datasets are imbalanced (10-20% defect rate). A naive model predicting "clean" for all modules achieves 80-90% accuracy but misses 100% of defects. We prioritize Recall, F1, PR-AUC, and Brier score.
2. **Q: Why is model confidence insufficient?**
   *A:* A model has no inherent awareness of its training distribution boundary. A deep tree or neural network can assign 95% probability to an unseen, out-of-distribution module.
3. **Q: What is the difference between Covariate Shift and Prior Probability Shift?**
   *A:* Covariate shift is when $P(X)$ changes (e.g. cyclomatic complexity jumps from 4 to 15). Prior shift is when $P(Y)$ changes (e.g. defect rate rises from 15% to 40%).
