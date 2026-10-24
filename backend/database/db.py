"""
Lightweight SQLite & State Persistence Database for DefectLens (X-Defect)
Stores datasets, trained models, batch shift reports, and prediction history.
"""
import sqlite3
import json
import os
from datetime import datetime, timezone

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "xdefect.db")

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS datasets (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        rows INTEGER,
        columns INTEGER,
        defect_rate REAL,
        features_json TEXT,
        created_at TEXT
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS models (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        algorithm TEXT NOT NULL,
        training_dataset TEXT,
        calibrated INTEGER,
        f1_score REAL,
        pr_auc REAL,
        roc_auc REAL,
        recall REAL,
        precision REAL,
        metrics_json TEXT,
        created_at TEXT
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS predictions (
        id TEXT PRIMARY KEY,
        model_id TEXT,
        module_id TEXT,
        prediction TEXT,
        probability REAL,
        confidence REAL,
        reliability_score REAL,
        reliability_status TEXT,
        shift_status TEXT,
        features_json TEXT,
        explanation_json TEXT,
        created_at TEXT
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS shift_reports (
        id TEXT PRIMARY KEY,
        model_id TEXT,
        dataset_name TEXT,
        shift_severity TEXT,
        shifted_features_count INTEGER,
        ood_percentage REAL,
        report_json TEXT,
        created_at TEXT
    )
    """)

    conn.commit()
    conn.close()

def save_prediction(record: dict):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO predictions (
        id, model_id, module_id, prediction, probability, confidence,
        reliability_score, reliability_status, shift_status, features_json,
        explanation_json, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        record["id"],
        record.get("model_id", "current"),
        record.get("module_id", "M-UNKNOWN"),
        record["prediction"],
        record["probability"],
        record["confidence"],
        record["reliability_score"],
        record["reliability_status"],
        record["shift_status"],
        json.dumps(record.get("features", {})),
        json.dumps(record.get("explanation", {})),
        datetime.now(timezone.utc).isoformat()
    ))
    conn.commit()
    conn.close()

def get_recent_predictions(limit: int = 50):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
    SELECT id, model_id, module_id, prediction, probability, confidence,
           reliability_score, reliability_status, shift_status, features_json, explanation_json, created_at
    FROM predictions ORDER BY created_at DESC LIMIT ?
    """, (limit,))
    rows = cursor.fetchall()
    conn.close()

    results = []
    for r in rows:
        results.append({
            "id": r[0],
            "model_id": r[1],
            "module_id": r[2],
            "prediction": r[3],
            "probability": r[4],
            "confidence": r[5],
            "reliability_score": r[6],
            "reliability_status": r[7],
            "shift_status": r[8],
            "features": json.loads(r[9]) if r[9] else {},
            "explanation": json.loads(r[10]) if r[10] else {},
            "created_at": r[11]
        })
    return results

def get_stats_summary():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM predictions")
    total_preds = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM predictions WHERE prediction = 'Defective'")
    high_risk_count = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM predictions WHERE reliability_status != 'HIGH_RELIABILITY'")
    shift_alerts = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM models")
    total_models = cursor.fetchone()[0]

    conn.close()
    return {
        "total_predictions": total_preds,
        "high_risk_modules": high_risk_count,
        "shift_alerts": shift_alerts,
        "total_models": max(1, total_models)
    }

init_db()
