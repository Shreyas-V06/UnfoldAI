from __future__ import annotations

from typing import Any

from app.repositories.base import BaseRepository

class LessonRepository(BaseRepository):
    """Repository for lesson operations."""
    
    def __init__(self, db: Any):
        super().__init__(db, "lessons")
        
    async def get_active_lessons(self, skip: int = 0, limit: int = 50) -> list[dict[str, Any]]:
        """Get active lessons, sorted by order."""
        cursor = self.collection.find({"is_active": True}).sort("order", 1).skip(skip).limit(limit)
        return await cursor.to_list(length=limit)
        
    async def get_by_subject(self, subject: str, skip: int = 0, limit: int = 50) -> list[dict[str, Any]]:
        """Get lessons by subject."""
        cursor = self.collection.find({"subject": subject}).skip(skip).limit(limit)
        return await cursor.to_list(length=limit)
