from __future__ import annotations

from datetime import datetime
from typing import Any
from bson import ObjectId

class BaseRepository:
    """Base repository providing generic CRUD operations for database storage."""
    
    def __init__(self, db: Any, collection_name: str):
        self.collection = db[collection_name]
        
    async def get_by_id(self, item_id: str) -> dict[str, Any] | None:
        """Get a document by its ObjectId."""
        if not ObjectId.is_valid(item_id):
            return None
        return await self.collection.find_one({"_id": ObjectId(item_id)})
        
    async def create(self, document: dict[str, Any]) -> dict[str, Any]:
        """Insert a document and return it with the generated _id."""
        doc_to_insert = dict(document)
        now = datetime.utcnow()
        if "created_at" not in doc_to_insert:
            doc_to_insert["created_at"] = now
        if "updated_at" not in doc_to_insert:
            doc_to_insert["updated_at"] = now
            
        result = await self.collection.insert_one(doc_to_insert)
        doc = await self.get_by_id(str(result.inserted_id))
        if doc is None:
            raise RuntimeError("Failed to retrieve document after creation.")
        return doc
        
    async def update(self, item_id: str, update_data: dict[str, Any]) -> dict[str, Any] | None:
        """Update a document by id and return the updated document."""
        if not ObjectId.is_valid(item_id):
            return None
        data = dict(update_data)
        data["updated_at"] = datetime.utcnow()
        await self.collection.update_one(
            {"_id": ObjectId(item_id)},
            {"$set": data}
        )
        return await self.get_by_id(item_id)
        
    async def delete(self, item_id: str) -> bool:
        """Delete a document by id. Returns True if deleted, False otherwise."""
        if not ObjectId.is_valid(item_id):
            return False
        result = await self.collection.delete_one({"_id": ObjectId(item_id)})
        return result.deleted_count > 0
        
    async def list_all(self, skip: int = 0, limit: int = 50, filter_query: dict[str, Any] | None = None) -> list[dict[str, Any]]:
        """List documents with pagination and optional filtering."""
        query = filter_query or {}
        cursor = self.collection.find(query).skip(skip).limit(limit)
        return await cursor.to_list(length=limit)
        
    async def count(self, filter_query: dict[str, Any] | None = None) -> int:
        """Count documents matching an optional filter."""
        query = filter_query or {}
        return await self.collection.count_documents(query)
