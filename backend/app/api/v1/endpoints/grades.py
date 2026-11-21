from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session
from app.db.db import get_db
from app.models.models import Assessment, Grade
from app.services import grade_service as svc

router = APIRouter(tags=["grades"])


# --- TMPR: HMD auth dependency (role + scope checks)
def get_current_user() -> int:
    return 1
# ------------------------------------------------------------------------------


class AssessmentIn(BaseModel):
    subject_id: int
    type: str  # micro | td_tp | exam | rtrpg
    weight: Decimal
    max_score: Decimal = Decimal("20")


class AssessmentOut(AssessmentIn):
    model_config = ConfigDict(from_attributes=True)
    id: int


class GradeIn(BaseModel):
    assessment_id: int
    student_id: int
    value: Decimal | None = None
    absence_code: str | None = None


class GradeEdit(BaseModel):
    value: Decimal | None = None
    absence_code: str | None = None
    reason: str | None = None


class Reason(BaseModel):
    reason: str


class GradeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    assessment_id: int
    student_id: int
    value: Decimal | None
    absence_code: str | None
    status: str
    locked: bool
    source: str


def _get_grade(db: Session, grade_id: int) -> Grade:
    grade = db.get(Grade, grade_id)
    if grade is None:
        raise HTTPException(404, "Grade not found")
    return grade


def _run(db: Session, fn, *args, **kwargs):
    """Run a service call, commit once, turn rule violations into HTTP 400."""
    try:
        result = fn(db, *args, **kwargs)
        db.commit()
        return result
    except svc.GradeError as e:
        db.rollback()
        raise HTTPException(400, str(e))


@router.post("/assessments", response_model=AssessmentOut, status_code=201)
def create_assessment(body: AssessmentIn, db: Session = Depends(get_db),
                      user_id: int = Depends(get_current_user)):
    # TODO: teacher / dept head only
    a = Assessment(**body.model_dump())
    db.add(a)
    db.commit()
    db.refresh(a)
    return a


@router.post("/grades", response_model=GradeOut, status_code=201)
def create_grade(body: GradeIn, db: Session = Depends(get_db),
                 user_id: int = Depends(get_current_user)):
    # TODO: teacher only, and only for assigned classes
    return _run(db, svc.create_grade, body.assessment_id, body.student_id,
                body.value, body.absence_code, user_id)


@router.put("/grades/{grade_id}", response_model=GradeOut)
def edit_grade(grade_id: int, body: GradeEdit, db: Session = Depends(get_db),
               user_id: int = Depends(get_current_user)):
    grade = _get_grade(db, grade_id)
    return _run(db, svc.edit_grade, grade, body.value, body.absence_code,
                user_id, body.reason)


@router.post("/grades/{grade_id}/submit", response_model=GradeOut)
def submit_grade(grade_id: int, db: Session = Depends(get_db),
                 user_id: int = Depends(get_current_user)):
    # TODO: teacher only
    return _run(db, svc.change_status, _get_grade(db, grade_id), "submitted", user_id)


@router.post("/grades/{grade_id}/validate", response_model=GradeOut)
def validate_grade(grade_id: int, db: Session = Depends(get_db),
                   user_id: int = Depends(get_current_user)):
    # TODO: department head only
    return _run(db, svc.change_status, _get_grade(db, grade_id), "validated", user_id)


@router.post("/grades/{grade_id}/publish", response_model=GradeOut)
def publish_grade(grade_id: int, db: Session = Depends(get_db),
                  user_id: int = Depends(get_current_user)):
    # TODO: department head only
    return _run(db, svc.change_status, _get_grade(db, grade_id), "published", user_id)


@router.post("/grades/{grade_id}/reject", response_model=GradeOut)
def reject_grade(grade_id: int, body: Reason, db: Session = Depends(get_db),
                 user_id: int = Depends(get_current_user)):
    # TODO: department head only
    return _run(db, svc.change_status, _get_grade(db, grade_id), "draft", user_id, body.reason)


@router.get("/grades", response_model=list[GradeOut])
def list_grades(assessment_id: int | None = None, student_id: int | None = None,
                status: str | None = None, db: Session = Depends(get_db),
                user_id: int = Depends(get_current_user)):
    q = db.query(Grade)
    if assessment_id is not None:
        q = q.filter(Grade.assessment_id == assessment_id)
    if student_id is not None:
        q = q.filter(Grade.student_id == student_id)
    if status is not None:
        q = q.filter(Grade.status == status)
    return q.order_by(Grade.id).all()


@router.get("/grades/{grade_id}", response_model=GradeOut)
def get_grade(grade_id: int, db: Session = Depends(get_db),
              user_id: int = Depends(get_current_user)):
    return _get_grade(db, grade_id)