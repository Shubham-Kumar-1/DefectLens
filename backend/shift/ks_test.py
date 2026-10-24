"""
Kolmogorov-Smirnov (KS) 2-Sample Test Module
Detects covariate shift on continuous software engineering metrics.
Hypothesis:
H0: Feature distributions in training and current production data are identical.
H1: Feature distributions differ significantly.
"""
import numpy as np
from scipy import stats

def compute_ks_test(baseline_values, current_values, alpha: float = 0.05, critical_stat: float = 0.15):
    """
    Computes 2-sample KS test between baseline (training) and current (evaluation) distribution.
    """
    b = np.asarray(baseline_values, dtype=float)
    c = np.asarray(current_values, dtype=float)

    # Filter NaNs
    b = b[~np.isnan(b)]
    c = c[~np.isnan(c)]

    if len(b) < 5 or len(c) < 5:
        return {
            "statistic": 0.0,
            "p_value": 1.0,
            "is_shifted": False,
            "severity": "LOW",
            "interpretation": "Insufficient samples for statistical test."
        }

    res = stats.ks_2samp(b, c)
    stat = round(float(res.statistic), 4)
    p_val = round(float(res.pvalue), 6)

    # Significant if p_value < alpha and stat magnitude exceeds critical threshold
    is_shifted = bool(p_val < alpha and stat >= critical_stat)

    if stat < 0.10:
        severity = "STABLE"
    elif stat < 0.20:
        severity = "LOW"
    elif stat < 0.35:
        severity = "MODERATE"
    else:
        severity = "HIGH"

    return {
        "statistic": stat,
        "p_value": p_val,
        "is_shifted": is_shifted,
        "severity": severity,
        "baseline_mean": round(float(np.mean(b)), 2),
        "current_mean": round(float(np.mean(c)), 2),
        "mean_delta_pct": round(float(((np.mean(c) - np.mean(b)) / (abs(np.mean(b)) + 1e-6)) * 100), 2),
        "interpretation": f"Distributions {'differ significantly (Covariate Shift)' if is_shifted else 'remain aligned with baseline'}."
    }
