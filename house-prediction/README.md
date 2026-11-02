# House Prediction API

A FastAPI service that predicts home prices using a simple linear regression model trained on the provided housing dataset.

## Endpoints

- `GET /health` — service health check
- `POST /predict` — single or batch price prediction
- `GET /model-info` — model coefficients and performance metrics
- `GET /docs` — Swagger/OpenAPI UI

## Run locally

```bash
uv sync
uv run house-prediction
```

Then open http://localhost:8000/docs

## Docker

```bash
docker build -t house-prediction .
docker run -p 8000:8000 house-prediction
```
