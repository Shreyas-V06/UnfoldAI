from fastapi import APIRouter, Depends, status, Response
from typing import Annotated

from app.models.lesson import LessonCreate, LessonUpdate, LessonResponse
from app.models.exercise import ExerciseCreate, ExerciseUpdate, ExerciseResponse
from app.services.admin_service import AdminService, get_admin_service

router = APIRouter(prefix="/admin", tags=["Admin"])

@router.post("/lessons", response_model=LessonResponse, status_code=status.HTTP_201_CREATED)
async def create_lesson(
    data: LessonCreate,
    admin_service: Annotated[AdminService, Depends(get_admin_service)]
):
    """Create a new lesson."""
    return await admin_service.create_lesson(data)

@router.put("/lessons/{lesson_id}", response_model=LessonResponse)
async def update_lesson(
    lesson_id: str,
    data: LessonUpdate,
    admin_service: Annotated[AdminService, Depends(get_admin_service)]
):
    """Update an existing lesson."""
    return await admin_service.update_lesson(lesson_id, data)

@router.delete("/lessons/{lesson_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_lesson(
    lesson_id: str,
    admin_service: Annotated[AdminService, Depends(get_admin_service)]
):
    """Delete a lesson."""
    await admin_service.delete_lesson(lesson_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)

@router.post("/lessons/{lesson_id}/exercises", response_model=ExerciseResponse, status_code=status.HTTP_201_CREATED)
async def add_exercise(
    lesson_id: str,
    data: ExerciseCreate,
    admin_service: Annotated[AdminService, Depends(get_admin_service)]
):
    """Add an exercise to a specific lesson."""
    return await admin_service.add_exercise(lesson_id, data)

@router.put("/exercises/{exercise_id}", response_model=ExerciseResponse)
async def update_exercise(
    exercise_id: str,
    data: ExerciseUpdate,
    admin_service: Annotated[AdminService, Depends(get_admin_service)]
):
    """Update an existing exercise."""
    return await admin_service.update_exercise(exercise_id, data)

@router.delete("/exercises/{exercise_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_exercise(
    exercise_id: str,
    admin_service: Annotated[AdminService, Depends(get_admin_service)]
):
    """Delete an exercise."""
    await admin_service.delete_exercise(exercise_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
