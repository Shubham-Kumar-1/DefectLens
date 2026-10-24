"""
Population Stability Index (PSI) Module
Quantifies distribution shift between baseline reference dataset and production dataset.
Formula:
PSI = sum( (Actual% - Expected%) * ln(Actual% / Expected%) )
"""
import numpy as np

def compute_psi(baseline_values, current_values, num_bins: int = 10):
    b = np.asarray(baseline_values, dtype=float)
    c = np.asarray(current_values, dtype=float)

    b = b[~np.isnan(b)]
    c = c[~np.isnan(c)]

    if len(b) < 10 or len(c) < 10:
        return {
            "psi": 0.0,
            "status": "STABLE",
            "interpretation": "Insufficient data points for quantile binning."
        }

    # Generate quantile bin edges from baseline distribution
    quantiles = np.linspace(0, 100, num_bins + 1)
    bin_edges = np.percentile(b, quantiles)
    bin_edges[0] = -np.inf
    bin_edges[-1] = np.inf

    # Ensure strictly increasing edges to avoid duplicate bin collapse
    unique_edges = [bin_edges[0]]
    for edge in bin_edges[1:]:
        if edge > unique_edges[-1]:
            unique_edges.append(edge)
        else:
            unique_edges.append(unique_edges[-1] + 1e-4)
    unique_edges[-1] = np.inf
    unique_edges = np.array(unique_edges)

    b_counts, _ = np.histogram(b, bins=unique_edges)
    c_counts, _ = np.histogram(c, bins=unique_edges)

    # Convert to proportions with Laplace smoothing
    epsilon = 1e-4
    b_pct = (b_counts + epsilon) / (len(b) + epsilon * len(b_counts))
    c_pct = (c_counts + epsilon) / (len(c) + epsilon * len(c_counts))

    # Calculate PSI per bin
    psi_vector = (c_pct - b_pct) * np.log(c_pct / b_pct)
    total_psi = round(float(np.sum(psi_vector)), 4)

    if total_psi < 0.10:
        status = "STABLE"
        color = "green"
        interpretation = "Minimal change; input distribution matches training data."
    elif total_psi < 0.25:
        status = "MODERATE_SHIFT"
        color = "amber"
        interpretation = "Noticeable distribution shift detected; model predictions warrant monitoring."
    else:
        status = "SIGNIFICANT_SHIFT"
        color = "red"
        interpretation = "Severe distribution shift! Model operating far outside training baseline."

    return {
        "psi": total_psi,
        "status": status,
        "color": color,
        "interpretation": interpretation
    }
