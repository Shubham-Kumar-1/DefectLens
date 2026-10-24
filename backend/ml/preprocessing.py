"""
Data Preprocessing Pipeline for Software Defect Prediction
Prevents data leakage: fit transformers on train data only, then transform test/deployment data.
"""
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, RobustScaler
from sklearn.feature_selection import mutual_info_classif
import joblib
import os

class DefectPreprocessor:
    def __init__(self, target_col: str = "defect", scaler_type: str = "robust"):
        self.target_col = target_col
        self.scaler_type = scaler_type
        self.scaler = RobustScaler() if scaler_type == "robust" else StandardScaler()
        self.feature_names = []
        self.imputer_values = {}
        self.is_fitted = False

    def fit(self, df: pd.DataFrame):
        df_clean = df.copy()
        
        # Identify feature columns
        cols = [c for c in df_clean.columns if c != self.target_col]
        # Filter numeric only
        numeric_cols = [c for c in cols if pd.api.types.is_numeric_dtype(df_clean[c])]
        self.feature_names = numeric_cols

        # Compute median imputation values
        for col in self.feature_names:
            median_val = float(df_clean[col].median(skipna=True))
            if np.isnan(median_val):
                median_val = 0.0
            self.imputer_values[col] = median_val
            df_clean[col] = df_clean[col].fillna(median_val)

        # Fit scaler on training feature matrix
        X = df_clean[self.feature_names].values
        self.scaler.fit(X)
        self.is_fitted = True
        return self

    def transform(self, df: pd.DataFrame, include_target: bool = True):
        if not self.is_fitted:
            raise ValueError("Preprocessor has not been fitted yet!")

        df_copy = df.copy()
        # Impute missing values with learned training medians
        for col in self.feature_names:
            if col in df_copy.columns:
                df_copy[col] = pd.to_numeric(df_copy[col], errors='coerce').fillna(self.imputer_values.get(col, 0.0))
            else:
                df_copy[col] = self.imputer_values.get(col, 0.0)

        X_raw = df_copy[self.feature_names].values
        X_scaled = self.scaler.transform(X_raw)

        y = None
        if include_target and self.target_col in df_copy.columns:
            y = pd.to_numeric(df_copy[self.target_col], errors='coerce').fillna(0).astype(int).values

        return X_scaled, y, self.feature_names

    def fit_transform(self, df: pd.DataFrame):
        self.fit(df)
        return self.transform(df)

    def compute_feature_rankings(self, df: pd.DataFrame):
        """Compute Mutual Information and Correlation rankings against defect target."""
        df_clean = df.copy()
        for col in self.feature_names:
            df_clean[col] = pd.to_numeric(df_clean[col], errors='coerce').fillna(self.imputer_values.get(col, 0.0))

        X = df_clean[self.feature_names].values
        y = pd.to_numeric(df_clean[self.target_col], errors='coerce').fillna(0).astype(int).values

        # Mutual information
        try:
            mi_scores = mutual_info_classif(X, y, random_state=42)
        except Exception:
            mi_scores = np.zeros(len(self.feature_names))

        # Correlation with target
        correlations = []
        for col in self.feature_names:
            col_std = df_clean[col].std()
            if col_std is None or np.isnan(col_std) or col_std == 0:
                correlations.append(0.0)
            else:
                corr = df_clean[col].corr(df_clean[self.target_col])
                correlations.append(0.0 if np.isnan(corr) else float(corr))

        rankings = []
        for i, col in enumerate(self.feature_names):
            rankings.append({
                "feature": col,
                "mutual_info": round(float(mi_scores[i]), 4),
                "correlation": round(float(correlations[i]), 4),
                "combined_rank_score": round(float(mi_scores[i] * 0.6 + abs(correlations[i]) * 0.4), 4)
            })

        rankings.sort(key=lambda x: x["combined_rank_score"], reverse=True)
        return rankings

    def save(self, filepath: str):
        joblib.dump(self, filepath)

    @classmethod
    def load(cls, filepath: str):
        return joblib.load(filepath)
