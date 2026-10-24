"""
Dataset Management Routes
Handles listing, inspection, and CSV upload for defect benchmark datasets.
"""
from fastapi import APIRouter, UploadFile, File, HTTPException
import os
import pandas as pd
import numpy as np

router = APIRouter(prefix="/datasets", tags=["datasets"])
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")

@router.get("/list")
def list_datasets():
    files = [f for f in os.listdir(DATA_DIR) if f.endswith(".csv")]
    result = []
    for f in sorted(files):
        path = os.path.join(DATA_DIR, f)
        df = pd.read_csv(path)
        defect_col = "defect" if "defect" in df.columns else None
        defect_rate = float(df[defect_col].mean()) if defect_col else 0.0
        
        name = os.path.splitext(f)[0].upper()
        if "SHIFTED" in name:
            domain_type = "Evolved / Shifted (2026 Project)"
            description = "Simulates severe temporal & architectural drift with elevated complexity."
        elif name in ["JM1", "KC1", "KC2", "PC1"]:
            domain_type = "NASA PROMISE Benchmark"
            description = f"Standard software engineering metric repository ({name})."
        else:
            domain_type = "User Uploaded"
            description = "Custom software project defect dataset."

        result.append({
            "filename": f,
            "name": name,
            "domain_type": domain_type,
            "description": description,
            "rows": len(df),
            "columns": len(df.columns),
            "features": [c for c in df.columns if c != "defect"],
            "defect_rate": round(defect_rate, 4),
            "defect_count": int(df[defect_col].sum()) if defect_col else 0
        })
    return {"datasets": result}

@router.get("/{name}/inspect")
def inspect_dataset(name: str):
    filename = f"{name.lower()}.csv" if not name.endswith(".csv") else name
    path = os.path.join(DATA_DIR, filename)
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Dataset not found")

    df = pd.read_csv(path)
    preview = df.head(15).to_dict(orient="records")
    
    # Feature stats
    stats = {}
    for col in df.columns:
        if pd.api.types.is_numeric_dtype(df[col]):
            stats[col] = {
                "mean": round(float(df[col].mean()), 2),
                "std": round(float(df[col].std()), 2),
                "min": round(float(df[col].min()), 2),
                "median": round(float(df[col].median()), 2),
                "max": round(float(df[col].max()), 2)
            }

    return {
        "name": name,
        "total_rows": len(df),
        "total_columns": len(df.columns),
        "columns": list(df.columns),
        "preview": preview,
        "statistics": stats
    }

@router.post("/upload")
async def upload_dataset(file: UploadFile = File(...)):
    if not file.filename.endswith((".csv", ".tsv")):
        raise HTTPException(status_code=400, detail="Only CSV/TSV files are supported.")

    dest = os.path.join(DATA_DIR, file.filename)
    content = await file.read()
    with open(dest, "wb") as f:
        f.write(content)

    try:
        df = pd.read_csv(dest)
        if len(df) < 10:
            os.remove(dest)
            raise HTTPException(status_code=400, detail="Dataset must contain at least 10 rows.")
    except Exception as e:
        if os.path.exists(dest):
            os.remove(dest)
        raise HTTPException(status_code=400, detail=f"Failed to parse CSV: {str(e)}")

    return {
        "message": "Dataset uploaded successfully",
        "filename": file.filename,
        "rows": len(df),
        "columns": list(df.columns)
    }
