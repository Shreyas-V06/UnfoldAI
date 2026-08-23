from __future__ import annotations

from typing import Any
from bson import ObjectId

from app.repositories.base import BaseRepository

class ExerciseResultRepository(BaseRepository):
    """Repository for exercise result operations."""
    
    def __init__(self, db: Any):
        super().__init__(db, "exercise_results")
        
    async def get_by_student_and_lesson(self, student_id: str, lesson_id: str) -> list[dict[str, Any]]:
        """Get exercise results by student and lesson IDs."""
        if not (ObjectId.is_valid(student_id) and ObjectId.is_valid(lesson_id)):
            return []
        cursor = self.collection.find({
            "student_id": ObjectId(student_id),
            "lesson_id": ObjectId(lesson_id)
        })
        return await cursor.to_list(length=None)
        
    async def get_by_student_and_exercise(self, student_id: str, exercise_id: str) -> dict[str, Any] | None:
        """Get a specific exercise result for a student."""
        if not (ObjectId.is_valid(student_id) and ObjectId.is_valid(exercise_id)):
            return None
        return await self.collection.find_one({
            "student_id": ObjectId(student_id),
            "exercise_id": ObjectId(exercise_id)
        })
        
    async def count_completed_for_lesson(self, student_id: str, lesson_id: str) -> int:
        """Count completed exercises for a student in a lesson."""
        if not (ObjectId.is_valid(student_id) and ObjectId.is_valid(lesson_id)):
            return 0
        return await self.collection.count_documents({
            "student_id": ObjectId(student_id),
            "lesson_id": ObjectId(lesson_id)
        })
        
    async def get_student_results(self, student_id: str, skip: int = 0, limit: int = 50) -> list[dict[str, Any]]:
        """Get all exercise results for a student, sorted by submitted_at desc."""
        if not ObjectId.is_valid(student_id):
            return []
        cursor = self.collection.find({"student_id": ObjectId(student_id)}).sort("submitted_at", -1).skip(skip).limit(limit)
        return await cursor.to_list(length=limit)
