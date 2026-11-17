from fastapi import FastAPI

app = FastAPI(title="SaaS Boilerplate API")


@app.get("/health")
def health():
    return {"status": "ok"}
