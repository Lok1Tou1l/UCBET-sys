from decimal import Decimal
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.db.db import get_db
from app.services.transcript_service import build_transcript

router = APIRouter(tags=["transcripts"])


class SubjectResult(BaseModel):
    subject_id: int
    subject: str
    average: Decimal | None


class TranscriptOut(BaseModel):
    student_id: int
    subjects: list[SubjectResult]

@router.get("/students/{student_id}/transcript", response_model=TranscriptOut)
def get_transcript(student_id: int, db: Session = Depends(get_db)):
    # TODO: student, or registrar / dept head (hmd)
    return build_transcript(db, student_id)