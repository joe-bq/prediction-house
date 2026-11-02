from __future__ import annotations

import csv
from functools import lru_cache
from pathlib import Path
from typing import Any

import numpy as np
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, ConfigDict
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

FEATURE_COLUMNS = [
    "square_footage",
    "bedrooms",
    "bathrooms",
    "year_built",
    "lot_size",
    "distance_to_city_center",
    "school_rating",
]

DATA_DIR = Path(__file__).resolve().parents[2] / "data"
TRAINING_DATA_PATH = DATA_DIR / "House Price Dataset.csv"


class HouseFeatures(BaseModel):
    model_config = ConfigDict(extra="forbid")

    square_footage: float
    bedrooms: float
    bathrooms: float
    year_built: float
    lot_size: float
    distance_to_city_center: float
    school_rating: float


class ModelBundle:
    def __init__(self, model: LinearRegression, metrics: dict[str, float], coefficients: dict[str, float], intercept: float):
        self.model = model
        self.metrics = metrics
        self.coefficients = coefficients
        self.intercept = intercept


def _read_training_rows() -> list[tuple[dict[str, float], float]]:
    if not TRAINING_DATA_PATH.exists():
        raise FileNotFoundError(f"Training dataset not found at {TRAINING_DATA_PATH}")

    rows: list[tuple[dict[str, float], float]] = []
    with TRAINING_DATA_PATH.open("r", newline="", encoding="utf-8-sig") as csv_file:
        reader = csv.DictReader(csv_file)
        for raw_row in reader:
            if raw_row is None:
                continue
            cleaned_row = {key.strip(): value.strip() if isinstance(value, str) else value for key, value in raw_row.items()}
            if not cleaned_row:
                continue
            feature_values = {feature: float(cleaned_row[feature]) for feature in FEATURE_COLUMNS}
            price = float(cleaned_row["price"])
            rows.append((feature_values, price))

    if not rows:
        raise ValueError(f"No rows could be loaded from {TRAINING_DATA_PATH}")
    return rows


def _build_feature_matrix(rows: list[dict[str, float]]) -> np.ndarray:
    return np.array([[row[feature] for feature in FEATURE_COLUMNS] for row in rows], dtype=float)


@lru_cache(maxsize=1)
def load_model_bundle() -> ModelBundle:
    rows = _read_training_rows()
    feature_rows = [item[0] for item in rows]
    prices = np.array([item[1] for item in rows], dtype=float)
    X = _build_feature_matrix(feature_rows)
    model = LinearRegression()
    model.fit(X, prices)

    predictions = model.predict(X)
    metrics = {
        "r2": float(r2_score(prices, predictions)),
        "mae": float(mean_absolute_error(prices, predictions)),
        "mse": float(mean_squared_error(prices, predictions)),
        "rmse": float(np.sqrt(mean_squared_error(prices, predictions))),
    }
    coefficients = {feature: float(value) for feature, value in zip(FEATURE_COLUMNS, model.coef_)}
    return ModelBundle(model=model, metrics=metrics, coefficients=coefficients, intercept=float(model.intercept_))


def _as_feature_matrix(input_data: HouseFeatures | list[HouseFeatures]) -> np.ndarray:
    if isinstance(input_data, list):
        records = [item.model_dump() for item in input_data]
    else:
        records = [input_data.model_dump()]

    return np.array([[record[feature] for feature in FEATURE_COLUMNS] for record in records], dtype=float)


app = FastAPI(
    title="House Prediction API",
    version="1.0.0",
    description="Simple regression service for predicting residential property prices from housing features.",
)


@app.get("/health")
def health() -> dict[str, Any]:
    return {
        "status": "ok",
        "service": "house-prediction",
        "features": FEATURE_COLUMNS,
    }


@app.post("/predict")
def predict(payload: HouseFeatures | list[HouseFeatures]) -> dict[str, Any]:
    try:
        model_bundle = load_model_bundle()
        feature_matrix = _as_feature_matrix(payload)
    except Exception as exc:  # pragma: no cover - defensive validation path
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    prediction_values = model_bundle.model.predict(feature_matrix)
    if isinstance(payload, list):
        return {
            "predictions": [
                {"index": idx, "prediction": float(value), "currency": "USD"}
                for idx, value in enumerate(prediction_values)
            ]
        }

    return {
        "prediction": float(prediction_values[0]),
        "currency": "USD",
        "model": "LinearRegression",
    }


@app.get("/model-info")
def model_info() -> dict[str, Any]:
    model_bundle = load_model_bundle()
    return {
        "model_type": "LinearRegression",
        "intercept": model_bundle.intercept,
        "coefficients": model_bundle.coefficients,
        "feature_columns": FEATURE_COLUMNS,
        "metrics": model_bundle.metrics,
        "data_file": str(TRAINING_DATA_PATH),
    }


def main() -> None:
    import uvicorn

    uvicorn.run("house_prediction.main:app", host="0.0.0.0", port=8000, reload=False)
