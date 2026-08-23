from __future__ import annotations

from typing import Any
from bson import ObjectId

from app.repositories.base import BaseRepository

class ExerciseRepository(BaseRepository):
    """Repository for exercise operations."""
    
    def __init__(self, db: Any):
        super().__init__(db, "exercises")
        
    async def get_by_lesson_id(self, lesson_id: str) -> list[dict[str, Any]]:
        """Get exercises by lesson ID, sorted by order."""
        if not ObjectId.is_valid(lesson_id):
            return []
        cursor = self.collection.find({"lesson_id": ObjectId(lesson_id)}).sort("order", 1)
        return await cursor.to_list(length=None)
        
    async def get_by_type(self, exercise_type: str, skip: int = 0, limit: int = 50) -> list[dict[str, Any]]:
        """Get exercises by type."""
        cursor = self.collection.find({"type": exercise_type}).skip(skip).limit(limit)
        return await cursor.to_list(length=limit)
        
    async def count_by_lesson(self, lesson_id: str) -> int:
        """Count exercises for a lesson."""
        if not ObjectId.is_valid(lesson_id):
            return 0
        return await self.collection.count_documents({"lesson_id": ObjectId(lesson_id)})
