from fastapi import APIRouter, Depends, Query, status
from typing import Annotated

from app.models.student import StudentCreate, StudentUpdate, StudentResponse
from app.models.student_memory import StudentMemoryResponse
from app.models.lesson_plan import LessonPlanResponse
from app.services.student_service import StudentService, get_student_service

router = APIRouter(prefix="/students", tags=["Students"])

@router.get("/", response_model=list[StudentResponse])
async def list_students(
    student_service: Annotated[StudentService, Depends(get_student_service)],
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100)
):
    """List all registered students."""
    return await student_service.list_students(skip, limit)

@router.post("/", response_model=StudentResponse, status_code=status.HTTP_201_CREATED)
async def register_student(
    data: StudentCreate,
    student_service: Annotated[StudentService, Depends(get_student_service)]
):
    """Register a new student."""
    return await student_service.register_student(data)

@router.get("/{student_id}", response_model=StudentResponse)
async def get_student(
    student_id: str,
    student_service: Annotated[StudentService, Depends(get_student_service)]
):
    """Get student profile by ID."""
    return await student_service.get_student(student_id)

@router.put("/{student_id}", response_model=StudentResponse)
async def update_student(
    student_id: str,
    data: StudentUpdate,
    student_service: Annotated[StudentService, Depends(get_student_service)]
):
    """Update student information."""
    return await student_service.update_student(student_id, data)

@router.get("/{student_id}/memory", response_model=StudentMemoryResponse)
async def get_student_memory(
    student_id: str,
    student_service: Annotated[StudentService, Depends(get_student_service)]
):
    """Get AI memory associated with a student."""
    return await student_service.get_student_memory(student_id)

@router.get("/{student_id}/lesson-plan", response_model=LessonPlanResponse | None)
async def get_student_lesson_plan(
    student_id: str,
    student_service: Annotated[StudentService, Depends(get_student_service)]
):
    """Get the latest lesson plan for a student."""
    return await student_service.get_student_lesson_plan(student_id)
