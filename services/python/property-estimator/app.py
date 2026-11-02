from __future__ import annotations

import os
from typing import Any

import requests
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator

app = FastAPI(title="Property Estimator API", version="1.0.0")

# allow CORS (Cross-Origin Resource Sharing)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)
# URL for the house price prediction model service
MODEL_URL = os.getenv("HOUSE_PREDICTION_URL", "http://localhost:8000")


class PropertyEstimateInput(BaseModel):
    square_footage: float = Field(..., gt=0)
    bedrooms: float = Field(..., gt=0)
    bathrooms: float = Field(..., gt=0)
    year_built: float = Field(..., gt=1800)
    lot_size: float = Field(..., gt=0)
    distance_to_city_center: float = Field(..., ge=0)
    school_rating: float = Field(..., ge=0, le=10)

    @field_validator("bedrooms", "bathrooms")
    @classmethod
    def validate_room_counts(cls, value: float) -> float:
        if value <= 0:
            raise ValueError("Room counts must be greater than zero.")
        return value


class PropertyEstimateResponse(BaseModel):
    prediction: float
    currency: str
    confidence: str
    source: str
    estimate_breakdown: dict[str, float]


@app.get("/api/health")
def health() -> dict[str, Any]:
    return {"status": "ok", "service": "property-estimator-api"}


def _fallback_prediction(payload: PropertyEstimateInput) -> float:
    base = payload.square_footage * 178
    base += payload.bedrooms * 19000
    base += payload.bathrooms * 24000
    base += (2025 - payload.year_built) * -350
    base += payload.lot_size * 18
    base -= payload.distance_to_city_center * 2150
    base += payload.school_rating * 42000
    return max(base, 65000.0)


# attempt to get prediction from the model service, fallback to local calculation if needed
def _try_model_prediction(payload: PropertyEstimateInput) -> dict[str, Any]:
    try:
        response = requests.post(
            f"{MODEL_URL}/predict",
            json={
                "square_footage": payload.square_footage,
                "bedrooms": payload.bedrooms,
                "bathrooms": payload.bathrooms,
                "year_built": payload.year_built,
                "lot_size": payload.lot_size,
                "distance_to_city_center": payload.distance_to_city_center,
                "school_rating": payload.school_rating,
            },
            timeout=10,
        )
        response.raise_for_status()
        result = response.json()
        return {
            "prediction": float(result["prediction"]),
            "currency": result.get("currency", "USD"),
            "source": "task-1-model",
        }
    except Exception:
        return {
            "prediction": _fallback_prediction(payload),
            "currency": "USD",
            "source": "local-fallback",
        }

# endpoint to get property estimate based on input features
@app.post("/api/estimate", response_model=PropertyEstimateResponse)
def estimate(payload: PropertyEstimateInput) -> PropertyEstimateResponse:
    try:
        model_result = _try_model_prediction(payload)
        estimate_value = float(model_result["prediction"])
        confidence = "High" if estimate_value > 350000 else "Moderate"
        return PropertyEstimateResponse(
            prediction=estimate_value,
            currency=model_result["currency"],
            confidence=confidence,
            source=model_result["source"],
            estimate_breakdown={
                "base_value": estimate_value * 0.72,
                "location_adjustment": estimate_value * 0.1,
                "features_adjustment": estimate_value * 0.18,
            },
        )
    except Exception as exc:  # pragma: no cover - defensive validation path
        raise HTTPException(status_code=400, detail=str(exc)) from exc
