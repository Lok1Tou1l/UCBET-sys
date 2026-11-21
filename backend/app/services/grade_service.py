from decimal import Decimal
from sqlalchemy.orm import Session
from app.models.models import Assessment, Grade, GradeChange

ABSENCE_CODES = {"ABS", "ABJ"} # ghaib ghaib with tabrir

TRANSITIONS = {
    "draft": {"submitted"},
    "submitted": {"validated", "draft"},  
    "validated": {"published"},
}


class GradeError(Exception):
    """Business-rule violation (the API will turn it into a 400)."""


def validate_mark(value: Decimal | None, absence_code: str | None, max_score: Decimal) -> None: # max in model line 
    if (value is None) == (absence_code is None):
        raise GradeError("Give either a mark or an absence code, not both/none")
    if absence_code is not None and absence_code not in ABSENCE_CODES:
        raise GradeError("Absence code must be ABS or ABJ")
    if value is not None and not (0 <= value <= max_score):
        raise GradeError(f"Mark must be between 0 and {max_score}")


def _log(db: Session, grade: Grade, actor_id: int, old_value, old_status, reason=None) -> None:
    db.add(GradeChange(
        grade_id=grade.id, actor_id=actor_id,
        old_value=old_value, new_value=grade.value,
        old_status=old_status, new_status=grade.status,
        reason=reason,
    ))


def create_grade(db: Session, assessment_id: int, student_id: int,
                 value: Decimal | None, absence_code: str | None,
                 actor_id: int, source: str = "manual") -> Grade:
    assessment = db.get(Assessment, assessment_id)
    if assessment is None:
        raise GradeError("Assessment not found")
    validate_mark(value, absence_code, assessment.max_score)

    exists = db.query(Grade).filter_by(assessment_id=assessment_id, student_id=student_id).first()
    if exists:
        raise GradeError("A grade already exists for this student and assessment")

    grade = Grade(assessment_id=assessment_id, student_id=student_id, value=value,
                  absence_code=absence_code, status="draft", source=source,
                  created_by=actor_id)
    db.add(grade)
    db.flush()  # gives grade.id
    _log(db, grade, actor_id, old_value=None, old_status=None)
    return grade


def edit_grade(db: Session, grade: Grade, value: Decimal | None,
               absence_code: str | None, actor_id: int, reason: str | None = None) -> Grade:
    if grade.locked or grade.status != "draft":
        raise GradeError("Only unlocked draft grades can be edited")
    assessment = db.get(Assessment, grade.assessment_id)
    validate_mark(value, absence_code, assessment.max_score)

    old_value = grade.value
    grade.value, grade.absence_code = value, absence_code
    _log(db, grade, actor_id, old_value=old_value, old_status=grade.status, reason=reason)
    return grade


def change_status(db: Session, grade: Grade, to: str, actor_id: int,
                  reason: str | None = None) -> Grade:
    if grade.locked:
        raise GradeError("Grade is locked")
    if to not in TRANSITIONS.get(grade.status, set()):
        raise GradeError(f"Cannot move from {grade.status} to {to}")
    if to == "draft" and not reason:
        raise GradeError("A reason is required to reject a grade")

    old_status = grade.status
    grade.status = to
    if to == "published":
        grade.locked = True
    _log(db, grade, actor_id, old_value=grade.value, old_status=old_status, reason=reason)
    return grade