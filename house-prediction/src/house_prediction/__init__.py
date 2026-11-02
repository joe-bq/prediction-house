from .main import app


def main() -> None:
    import uvicorn

    uvicorn.run("house_prediction.main:app", host="0.0.0.0", port=8000, reload=False)
