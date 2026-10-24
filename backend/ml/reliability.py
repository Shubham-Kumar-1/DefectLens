"""
Prediction Reliability Assessment Layer
Explicitly separates Model Confidence from Deployment Reliability.
Synthesizes:
1. Model Output Confidence: |P(Defect) - 0.5| * 2
2. Dataset Shift Context: Low / Moderate / High
3. Instance-level Out-of-Distribution Mahalanobis Distance
"""
from typing import Dict, Any

def compute_prediction_reliability(
    probability: float,
    shift_severity: str,
    ood_result: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Computes an operational reliability score and actionable guidance for software engineers.
    """
    prob = float(probability)
    # Raw statistical confidence from the model (distance from decision boundary 0.5)
    model_confidence = round(abs(prob - 0.5) * 2.0, 4)
    
    # Penalties based on deployment distribution
    shift_penalties = {
        "LOW": 0.05,
        "MODERATE": 0.30,
        "HIGH": 0.60
    }
    shift_penalty = shift_penalties.get(shift_severity.upper(), 0.20)

    # OOD penalty
    ood_status = ood_result.get("status", "IN_DISTRIBUTION")
    if ood_status == "IN_DISTRIBUTION":
        ood_penalty = 0.0
    elif ood_status == "BORDERLINE":
        ood_penalty = 0.15
    elif ood_status == "OUT_OF_DISTRIBUTION":
        ood_penalty = 0.40
    else: # EXTREME_OOD
        ood_penalty = 0.70

    # Composite reliability calculation
    # Starts from model confidence, scaled downwards by environmental shift and OOD risk
    raw_reliability = max(0.05, (1.0 - (shift_penalty * 0.6 + ood_penalty * 0.4)))
    # Weight by model confidence: if the model is near 0.5, confidence is naturally low too
    confidence_factor = 0.4 + 0.6 * model_confidence
    final_reliability_score = round(float(raw_reliability * confidence_factor * 100), 1)

    # Reliability Tier Classification
    if final_reliability_score >= 70.0 and shift_severity == "LOW" and ood_status == "IN_DISTRIBUTION":
        status = "HIGH_RELIABILITY"
        badge = "Trusted Prediction"
        color = "emerald"
        warning = False
        action_advice = "Prediction was generated within familiar training distributions. Safe for automated defect triage."
    elif final_reliability_score >= 45.0 and shift_severity != "HIGH":
        status = "MODERATE_RELIABILITY"
        badge = "Proceed with Caution"
        color = "amber"
        warning = True
        action_advice = "Mild distribution divergence or borderline metrics detected. Secondary peer review recommended."
    else:
        status = "LOW_RELIABILITY_UNTRUSTED"
        badge = "Unreliable Under Shift"
        color = "rose"
        warning = True
        action_advice = "WARNING: Model is operating under severe dataset shift or out-of-distribution conditions. Confidence is deceptive; manually audit this software module."

    # Explaining the Confidence vs Reliability distinction
    paradox_note = None
    if model_confidence >= 0.75 and status == "LOW_RELIABILITY_UNTRUSTED":
        paradox_note = (
            f"Overconfidence Paradox: Model outputs high statistical confidence ({prob:.1%}), "
            f"yet the module's metrics are heavily shifted (Mahalanobis D={ood_result.get('mahalanobis_distance', 0)}). "
            f"Real-world reliability is severely compromised."
        )

    return {
        "reliability_score": final_reliability_score,
        "reliability_status": status,
        "reliability_badge": badge,
        "badge_color": color,
        "reliability_warning": warning,
        "model_confidence": round(model_confidence, 3),
        "model_confidence_pct": round(model_confidence * 100, 1),
        "actionable_advice": action_advice,
        "paradox_note": paradox_note,
        "breakdown": {
            "shift_severity": shift_severity,
            "ood_status": ood_status,
            "mahalanobis_distance": ood_result.get("mahalanobis_distance", 0.0),
            "p95_cutoff": ood_result.get("threshold_p95", 0.0)
        }
    }
