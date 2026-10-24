"""
Out-of-Distribution (OOD) Detector
Uses Mahalanobis Distance with regularized covariance to flag anomalous software modules.
"""
import numpy as np
from sklearn.covariance import EmpiricalCovariance, LedoitWolf

class OODDetector:
    def __init__(self):
        self.mean_vector = None
        self.inv_cov = None
        self.p90 = 0.0
        self.p95 = 0.0
        self.p99 = 0.0
        self.is_fitted = False

    def fit(self, X_train: np.ndarray):
        """Fit empirical mean and regularized covariance matrix on scaled training features."""
        X = np.asarray(X_train, dtype=float)
        self.mean_vector = np.mean(X, axis=0)
        
        # Use LedoitWolf shrinkage for numerically well-conditioned covariance inverse
        try:
            cov_estimator = LedoitWolf().fit(X)
            self.inv_cov = cov_estimator.precision_
        except Exception:
            cov = np.cov(X, rowvar=False)
            reg_cov = cov + np.eye(X.shape[1]) * 1e-4
            self.inv_cov = np.linalg.pinv(reg_cov)

        # Compute training distances to establish empirical percentile thresholds
        diff = X - self.mean_vector
        # Mahalanobis squared: sum((diff @ inv_cov) * diff, axis=1)
        distances = np.sqrt(np.maximum(0, np.sum((diff @ self.inv_cov) * diff, axis=1)))
        
        self.p90 = float(np.percentile(distances, 90))
        self.p95 = float(np.percentile(distances, 95))
        self.p99 = float(np.percentile(distances, 99))
        self.is_fitted = True
        return self

    def score_sample(self, x_sample: np.ndarray):
        """Compute Mahalanobis distance and OOD risk classification for a single instance."""
        if not self.is_fitted:
            return {"distance": 0.0, "status": "UNKNOWN", "risk": "LOW"}

        diff = x_sample - self.mean_vector
        dist = float(np.sqrt(np.maximum(0, np.dot(np.dot(diff, self.inv_cov), diff))))

        if dist < self.p90:
            status = "IN_DISTRIBUTION"
            risk = "NORMAL"
            desc = "Module software metrics conform closely with historical training patterns."
        elif dist < self.p95:
            status = "BORDERLINE"
            risk = "MILD_SHIFT"
            desc = "Module shows slight structural divergence from typical training codebase."
        elif dist < self.p99:
            status = "OUT_OF_DISTRIBUTION"
            risk = "ELEVATED"
            desc = "Module metrics fall in the outer 5% extreme tail of the training domain."
        else:
            status = "EXTREME_OOD"
            risk = "CRITICAL"
            desc = "Severe anomaly! Model has virtually no comparable instances in training data."

        return {
            "mahalanobis_distance": round(dist, 2),
            "threshold_p95": round(self.p95, 2),
            "threshold_p99": round(self.p99, 2),
            "status": status,
            "risk": risk,
            "description": desc
        }

    def score_batch(self, X_batch: np.ndarray):
        """Compute OOD statistics across an entire batch of modules."""
        if not self.is_fitted:
            return {"ood_fraction": 0.0, "avg_distance": 0.0}

        diff = X_batch - self.mean_vector
        distances = np.sqrt(np.maximum(0, np.sum((diff @ self.inv_cov) * diff, axis=1)))
        ood_count = int(np.sum(distances > self.p95))
        fraction = round(float(ood_count / len(distances)), 4)

        return {
            "total_modules": len(distances),
            "ood_count": ood_count,
            "ood_fraction": fraction,
            "ood_percentage": round(fraction * 100, 1),
            "avg_distance": round(float(np.mean(distances)), 2),
            "max_distance": round(float(np.max(distances)), 2),
            "p95_threshold": round(self.p95, 2)
        }
