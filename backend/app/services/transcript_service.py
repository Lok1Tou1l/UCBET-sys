from decimal import ROUND_HALF_UP, Decimal
from sqlalchemy.orm import Session
from app.models.models import Assessment, Grade, Subject

TWO = Decimal("0.01")

def build_transcript(db: Session, student_id: int) -> dict:
    """Weighted average per subject, from PUBLISHED grades only, on a /20 scale."""
    rows = (
        db.query(Grade, Assessment, Subject)
        .join(Assessment, Grade.assessment_id == Assessment.id)
        .join(Subject, Assessment.subject_id == Subject.id)
        .filter(Grade.student_id == student_id, Grade.status == "published")
        .all()
    )

    per_subject: dict[int, dict] = {}
    for grade, assessment, subject in rows:
        d = per_subject.setdefault(
            subject.id,
            {"subject_id": subject.id, "subject": subject.name,
             "points": Decimal(0), "weight": Decimal(0)},
        )
        if grade.absence_code == "ABJ":     
            continue
        if grade.absence_code == "ABS":     
            mark = Decimal(0)
        else:
            mark = grade.value / assessment.max_score * 20
        d["points"] += mark * assessment.weight
        d["weight"] += assessment.weight

    subjects = []
    for d in per_subject.values():
        avg = (d["points"] / d["weight"]).quantize(TWO, ROUND_HALF_UP) if d["weight"] else None
        subjects.append({"subject_id": d["subject_id"], "subject": d["subject"], "average": avg})

    return {"student_id": student_id, "subjects": subjects}