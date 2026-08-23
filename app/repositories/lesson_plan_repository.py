from __future__ import annotations

from typing import Any
from bson import ObjectId

from app.repositories.base import BaseRepository

class LessonPlanRepository(BaseRepository):
    """Repository for lesson plan operations."""
    
    def __init__(self, db: Any):
        super().__init__(db, "lesson_plans")
        
    async def get_latest_for_student(self, student_id: str) -> dict[str, Any] | None:
        """Get the most recently generated lesson plan for a student."""
        if not ObjectId.is_valid(student_id):
            return None
        cursor = self.collection.find({"student_id": ObjectId(student_id)}).sort("generated_at", -1).limit(1)
        results = await cursor.to_list(length=1)
        return results[0] if results else None
        
    async def get_plans_for_student(self, student_id: str, skip: int = 0, limit: int = 50) -> list[dict[str, Any]]:
        """Get all lesson plans for a student."""
        if not ObjectId.is_valid(student_id):
            return []
        cursor = self.collection.find({"student_id": ObjectId(student_id)}).sort("generated_at", -1).skip(skip).limit(limit)
        return await cursor.to_list(length=limit)
