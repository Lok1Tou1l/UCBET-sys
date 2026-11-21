from fastapi import FastAPI
from app.api.v1.endpoints import grades
from app.db.db import Base, engine
from app.models import models as _models
from app.api.v1.endpoints import transcripts

Base.metadata.create_all(engine)

app = FastAPI(title="SaaS Boilerplate API")

app.include_router(grades.router)
app.include_router(transcripts.router)

@app.get("/health")
def health():
    return {"status": "ok"}
