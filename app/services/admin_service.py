from __future__ import annotations

from typing import Annotated, Any
from bson import ObjectId

from fastapi import Depends

from app.core.database import get_database
from app.exceptions.handlers import EntityNotFoundException, ValidationException
from app.models.lesson import LessonCreate, LessonUpdate, LessonResponse
from app.models.exercise import ExerciseCreate, ExerciseUpdate, ExerciseResponse
from app.repositories.lesson_repository import LessonRepository
from app.repositories.exercise_repository import ExerciseRepository


class AdminService:
    """Service for handling administrative operations like managing content."""

    def __init__(self, db: Any):
        self.db = db
        self.lesson_repo = LessonRepository(db)
        self.exercise_repo = ExerciseRepository(db)

    async def create_lesson(self, data: LessonCreate) -> LessonResponse:
        """Create a new lesson."""
        doc = await self.lesson_repo.create(data.model_dump(exclude_none=True))
        return LessonResponse.model_validate(doc)

    async def update_lesson(self, lesson_id: str, data: LessonUpdate) -> LessonResponse:
        """Update an existing lesson."""
        doc = await self.lesson_repo.update(lesson_id, data.model_dump(exclude_unset=True))
        if not doc:
            raise EntityNotFoundException(f"Lesson with id {lesson_id} not found")
        return LessonResponse.model_validate(doc)

    async def delete_lesson(self, lesson_id: str) -> bool:
        """Delete a lesson."""
        deleted = await self.lesson_repo.delete(lesson_id)
        if not deleted:
            raise EntityNotFoundException(f"Lesson with id {lesson_id} not found")
        return True

    async def add_exercise(self, lesson_id: str, data: ExerciseCreate) -> ExerciseResponse:
        """Add a new exercise to a lesson."""
        lesson = await self.lesson_repo.get_by_id(lesson_id)
        if not lesson:
            raise EntityNotFoundException(f"Lesson with id {lesson_id} not found")
            
        if str(data.lesson_id) != lesson_id:
            raise ValidationException("Lesson ID in path must match Lesson ID in body")
            
        doc = await self.exercise_repo.create(data.model_dump(by_alias=True, exclude_none=True))
        return ExerciseResponse.model_validate(doc)

    async def update_exercise(self, exercise_id: str, data: ExerciseUpdate) -> ExerciseResponse:
        """Update an existing exercise."""
        doc = await self.exercise_repo.update(exercise_id, data.model_dump(exclude_unset=True))
        if not doc:
            raise EntityNotFoundException(f"Exercise with id {exercise_id} not found")
        return ExerciseResponse.model_validate(doc)

    async def delete_exercise(self, exercise_id: str) -> bool:
        """Delete an exercise."""
        deleted = await self.exercise_repo.delete(exercise_id)
        if not deleted:
            raise EntityNotFoundException(f"Exercise with id {exercise_id} not found")
        return True


async def get_admin_service(db: Annotated[Any, Depends(get_database)]) -> AdminService:
    """Dependency factory for AdminService."""
    return AdminService(db)
