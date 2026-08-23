from fastapi import APIRouter, Depends, Query
from typing import Annotated

from app.models.lesson import LessonResponse, LessonDetailResponse
from app.services.lesson_service import LessonService, get_lesson_service

router = APIRouter(prefix="/lessons", tags=["Lessons"])

@router.get("/", response_model=list[LessonResponse])
async def list_active_lessons(
    lesson_service: Annotated[LessonService, Depends(get_lesson_service)],
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    subject: str | None = Query(None)
):
    """List active lessons, optionally filtered by subject."""
    return await lesson_service.list_lessons(skip, limit, subject)

@router.get("/{lesson_id}", response_model=LessonDetailResponse)
async def get_lesson_detail(
    lesson_id: str,
    lesson_service: Annotated[LessonService, Depends(get_lesson_service)]
):
    """Get a specific lesson along with its exercises."""
    return await lesson_service.get_lesson_detail(lesson_id)
