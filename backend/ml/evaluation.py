"""
Model Evaluation and Probability Calibration Module
Provides rigorous metrics for defect prediction (imbalance-aware) and reliability diagrams.
"""
import numpy as np
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, average_precision_score, balanced_accuracy_score,
    confusion_matrix, brier_score_loss
)
from sklearn.calibration import calibration_curve

def evaluate_classification(y_true, y_pred, y_prob):
    """
    Imbalance-aware classification evaluation.
    Recall for defective modules is prioritized because missed defects incur high software costs.
    """
    tn, fp, fn, tp = confusion_matrix(y_true, y_pred).ravel()
    
    # Calculate ROC-AUC and PR-AUC safely
    try:
        roc_auc = float(roc_auc_score(y_true, y_prob))
    except Exception:
        roc_auc = 0.5

    try:
        pr_auc = float(average_precision_score(y_true, y_prob))
    except Exception:
        pr_auc = float(np.mean(y_true))

    brier = float(brier_score_loss(y_true, y_prob))
    
    # Calibration curve (Reliability Diagram points)
    try:
        prob_true, prob_pred = calibration_curve(y_true, y_prob, n_bins=10, strategy='uniform')
        calibration_points = [
            {"expected_prob": round(float(p), 4), "observed_prob": round(float(o), 4)}
            for p, o in zip(prob_pred, prob_true)
        ]
    except Exception:
        calibration_points = []

    return {
        "accuracy": round(float(accuracy_score(y_true, y_pred)), 4),
        "balanced_accuracy": round(float(balanced_accuracy_score(y_true, y_pred)), 4),
        "precision": round(float(precision_score(y_true, y_pred, zero_division=0)), 4),
        "recall": round(float(recall_score(y_true, y_pred, zero_division=0)), 4),
        "f1_score": round(float(f1_score(y_true, y_pred, zero_division=0)), 4),
        "roc_auc": round(roc_auc, 4),
        "pr_auc": round(pr_auc, 4),
        "brier_score": round(brier, 4),
        "confusion_matrix": {
            "true_negatives": int(tn),
            "false_positives": int(fp),
            "false_negatives": int(fn),
            "true_positives": int(tp)
        },
        "calibration_curve": calibration_points,
        "sample_counts": {
            "total": int(len(y_true)),
            "defective": int(sum(y_true)),
            "non_defective": int(len(y_true) - sum(y_true)),
            "defect_rate": round(float(np.mean(y_true)), 4)
        }
    }
