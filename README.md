# Multi-Application Property Portal

This repository contains the Task 2 portal and supporting backend services for the property intelligence platform.

## Services

- `house-prediction`: Task 1 ML model API trained on the house price dataset.
- `services/python/property-estimator`: Python FastAPI estimator API that validates form submissions and calls the Task 1 model container.
- `services/java/property-market-service`: Java Spring Boot market analysis API with aggregated statistics, filtering, caching, and scenario simulation.
- `portal`: Next.js app shell that hosts both property applications.

## Local startup

```bash
# Start the model + Python + Java + portal services
cd /Users/joe/branches/hsbc
docker compose up --build
```

Then open:

- Portal: http://localhost:3000
- Estimator API: http://localhost:8001/docs
- Market Analysis API: http://localhost:8080/actuator/health
- House model API: http://localhost:8000/docs

## Direct service startup

### Python estimator API

```bash
cd /Users/joe/branches/hsbc/services/python/property-estimator
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 8001
```

### Java market analysis API

```bash
cd /Users/joe/branches/hsbc/services/java/property-market-service
mvn spring-boot:run
```

### Portal

```bash
cd /Users/joe/branches/hsbc/portal
npm install
npm run dev
```
