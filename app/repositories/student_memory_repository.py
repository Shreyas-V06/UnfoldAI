from __future__ import annotations

from typing import Any
from bson import ObjectId

from app.repositories.base import BaseRepository

class StudentMemoryRepository(BaseRepository):
    """Repository for student memory operations."""
    
    def __init__(self, db: Any):
        super().__init__(db, "student_memory")
        
    async def get_by_student_id(self, student_id: str) -> dict[str, Any] | None:
        """Get memory data by student ID."""
        if not ObjectId.is_valid(student_id):
            return None
        return await self.collection.find_one({"student_id": ObjectId(student_id)})
        
    async def upsert(self, student_id: str, memory_data: dict[str, Any]) -> dict[str, Any]:
        """Update or insert memory data for a student."""
        if not ObjectId.is_valid(student_id):
            raise ValueError(f"Invalid student ID: {student_id}")
            
        student_obj_id = ObjectId(student_id)
        
        # Merge student_id into memory_data to ensure it's saved correctly
        update_data = dict(memory_data)
        if "student_id" not in update_data:
            update_data["student_id"] = student_obj_id
        elif isinstance(update_data["student_id"], str):
            update_data["student_id"] = ObjectId(update_data["student_id"])
            
        await self.collection.update_one(
            {"student_id": student_obj_id},
            {"$set": update_data},
            upsert=True
        )
        doc = await self.get_by_student_id(student_id)
        if doc is None:
            raise RuntimeError("Failed to retrieve document after upsert.")
        return doc
