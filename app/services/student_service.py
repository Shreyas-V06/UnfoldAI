from __future__ import annotations

from typing import Annotated, Any

from bson import ObjectId
from fastapi import Depends

from app.core.database import get_database
from app.exceptions.handlers import EntityNotFoundException, DuplicateEntityException
from app.models.student import StudentCreate, StudentUpdate, StudentResponse
from app.models.student_memory import StudentMemoryResponse
from app.models.lesson_plan import LessonPlanResponse
from app.repositories.student_repository import StudentRepository
from app.repositories.student_memory_repository import StudentMemoryRepository
from app.repositories.lesson_plan_repository import LessonPlanRepository


class StudentService:
    """Service for handling student-related operations."""

    def __init__(self, db: Any):
        self.db = db
        self.student_repo = StudentRepository(db)
        self.memory_repo = StudentMemoryRepository(db)
        self.lesson_plan_repo = LessonPlanRepository(db)

    async def register_student(self, data: StudentCreate) -> StudentResponse:
        """Register a new student."""
        existing = await self.student_repo.get_by_email(data.email)
        if existing:
            raise DuplicateEntityException("Student with this email already exists")

        doc = await self.student_repo.create(data.model_dump(exclude_none=True))
        return StudentResponse.model_validate(doc)

    async def get_student(self, student_id: str) -> StudentResponse:
        """Get a student by ID."""
        doc = await self.student_repo.get_by_id(student_id)
        if not doc:
            raise EntityNotFoundException(f"Student with id {student_id} not found")
        return StudentResponse.model_validate(doc)

    async def update_student(self, student_id: str, data: StudentUpdate) -> StudentResponse:
        """Update a student's information."""
        update_data = data.model_dump(exclude_unset=True)
        doc = await self.student_repo.update(student_id, update_data)
        if not doc:
            raise EntityNotFoundException(f"Student with id {student_id} not found")
        return StudentResponse.model_validate(doc)

    async def get_student_memory(self, student_id: str) -> StudentMemoryResponse:
        """Get the memory associated with a student."""
        doc = await self.memory_repo.get_by_student_id(student_id)
        if not doc:
            from app.models.student_memory import StudentMemoryCreate
            empty_memory = StudentMemoryCreate.create_empty(ObjectId(student_id))
            return StudentMemoryResponse.model_validate(empty_memory)
        return StudentMemoryResponse.model_validate(doc)

    async def list_students(self, skip: int = 0, limit: int = 50) -> list[StudentResponse]:
        """List registered students."""
        docs = await self.student_repo.list_all(skip, limit)
        return [StudentResponse.model_validate(doc) for doc in docs]

    async def get_student_lesson_plan(self, student_id: str) -> LessonPlanResponse | None:
        """Get the latest lesson plan for a student."""
        doc = await self.lesson_plan_repo.get_latest_for_student(student_id)
        if not doc:
            return None
        return LessonPlanResponse.model_validate(doc)


async def get_student_service(db: Annotated[Any, Depends(get_database)]) -> StudentService:
    """Dependency factory for StudentService."""
    return StudentService(db)
