from __future__ import annotations

from typing import Annotated, Any

from fastapi import Depends

from app.core.database import get_database
from app.exceptions.handlers import EntityNotFoundException
from app.models.lesson import LessonResponse, LessonDetailResponse
from app.models.exercise import ExerciseResponse
from app.repositories.lesson_repository import LessonRepository
from app.repositories.exercise_repository import ExerciseRepository


class LessonService:
    """Service for handling lesson-related operations."""

    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.lesson_repo = LessonRepository(db)
        self.exercise_repo = ExerciseRepository(db)

    async def list_lessons(self, skip: int = 0, limit: int = 10, subject: str | None = None) -> list[LessonResponse]:
        """List active lessons, optionally filtered by subject."""
        if subject:
            lessons = await self.lesson_repo.get_by_subject(subject, skip, limit)
        else:
            lessons = await self.lesson_repo.get_active_lessons(skip, limit)
        return [LessonResponse.model_validate(lesson) for lesson in lessons]

    async def get_lesson_detail(self, lesson_id: str) -> LessonDetailResponse:
        """Get a lesson with its exercises."""
        lesson_doc = await self.lesson_repo.get_by_id(lesson_id)
        if not lesson_doc:
            raise EntityNotFoundException(f"Lesson with id {lesson_id} not found")

        exercise_docs = await self.exercise_repo.get_by_lesson_id(lesson_id)
        
        lesson_dict = dict(lesson_doc)
        lesson_dict["exercises"] = [ExerciseResponse.model_validate(ex) for ex in exercise_docs]
        
        return LessonDetailResponse.model_validate(lesson_dict)


async def get_lesson_service(db: Annotated[Any, Depends(get_database)]) -> LessonService:
    """Dependency factory for LessonService."""
    return LessonService(db)
