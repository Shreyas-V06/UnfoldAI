from __future__ import annotations

from typing import Any

from app.repositories.base import BaseRepository

class StudentRepository(BaseRepository):
    """Repository for student operations."""
    
    def __init__(self, db: Any):
        super().__init__(db, "students")
        
    async def get_by_email(self, email: str) -> dict[str, Any] | None:
        """Get a student by their email address."""
        return await self.collection.find_one({"email": email})
