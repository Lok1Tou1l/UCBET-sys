from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.api.deps import require_roles
from app.db.db import get_db
from app.models.user import User
from app.schemas.user_import import ImportReport
from app.services import user_import_service

router = APIRouter(prefix="/users", tags=["users"])

MAX_BYTES = 2 * 1024 * 1024


@router.post("/import", response_model=ImportReport)
async def import_users(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    admin: User = Depends(require_roles("admin")),
):
    content = await file.read(MAX_BYTES + 1)
    if len(content) > MAX_BYTES:
        raise HTTPException(status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, "File too large")
    try:
        return user_import_service.import_users(db, content, actor_id=admin.id)
    except user_import_service.ImportError_ as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(e))