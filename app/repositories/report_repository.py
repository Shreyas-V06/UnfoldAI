from __future__ import annotations

from typing import Any
from bson import ObjectId

from app.repositories.base import BaseRepository

class ReportRepository(BaseRepository):
    """Repository for report operations."""
    
    def __init__(self, db: Any):
        super().__init__(db, "reports")
        
    async def get_by_student(self, student_id: str, skip: int = 0, limit: int = 50) -> list[dict[str, Any]]:
        """Get reports for a student, sorted by generated_at desc."""
        if not ObjectId.is_valid(student_id):
            return []
        cursor = self.collection.find({"student_id": ObjectId(student_id)}).sort("generated_at", -1).skip(skip).limit(limit)
        return await cursor.to_list(length=limit)
        
    async def get_by_student_and_period(self, student_id: str, period: str) -> dict[str, Any] | None:
        """Get a report for a student for a specific period."""
        if not ObjectId.is_valid(student_id):
            return None
        return await self.collection.find_one({
            "student_id": ObjectId(student_id),
            "period": period
        })
