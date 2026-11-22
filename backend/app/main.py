from fastapi import FastAPI

from app.api.v1.endpoints import auth, grades, transcripts

app = FastAPI(title="SaaS Boilerplate API")

API_PREFIX = "/api/v1"

app.include_router(auth.router, prefix=API_PREFIX)
app.include_router(grades.router, prefix=API_PREFIX)
app.include_router(transcripts.router, prefix=API_PREFIX)


@app.get("/health")
def health():
    return {"status": "ok"}