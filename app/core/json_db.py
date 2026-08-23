import asyncio
import copy
from datetime import datetime
from enum import Enum
import json
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional, Union
from bson import ObjectId

logger = logging.getLogger(__name__)


def serialize_for_json(obj: Any) -> Any:
    """Recursively serialize Python / BSON objects to standard JSON serializable types."""
    if isinstance(obj, ObjectId):
        return str(obj)
    if isinstance(obj, datetime):
        return obj.isoformat()
    if isinstance(obj, Enum):
        return obj.value
    if isinstance(obj, dict):
        return {k: serialize_for_json(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple, set)):
        return [serialize_for_json(i) for i in obj]
    return obj


def deserialize_from_json(obj: Any, key_name: str = "") -> Any:
    """Recursively deserialize JSON primitives back to rich types (ObjectId, datetime)."""
    if isinstance(obj, str):
        # Convert _id and foreign key fields ending with _id back to ObjectId
        if key_name == "_id" or key_name.endswith("_id"):
            if ObjectId.is_valid(obj):
                return ObjectId(obj)
        # Parse ISO datetime strings
        if len(obj) >= 19 and (obj[4] == "-" and obj[7] == "-" and "T" in obj):
            try:
                return datetime.fromisoformat(obj)
            except (ValueError, TypeError):
                pass
        return obj

    if isinstance(obj, dict):
        return {k: deserialize_from_json(v, k) for k, v in obj.items()}
    if isinstance(obj, list):
        return [deserialize_from_json(item, key_name) for item in obj]
    return obj


class InsertOneResult:
    def __init__(self, inserted_id: ObjectId):
        self.inserted_id = inserted_id


class UpdateResult:
    def __init__(self, matched_count: int, modified_count: int, upserted_id: Optional[ObjectId] = None):
        self.matched_count = matched_count
        self.modified_count = modified_count
        self.upserted_id = upserted_id


class DeleteResult:
    def __init__(self, deleted_count: int):
        self.deleted_count = deleted_count


class JSONCursor:
    """Async cursor interface mimicking Motor's AsyncIOMotorCursor."""

    def __init__(self, documents: List[Dict[str, Any]]):
        self._docs = list(documents)
        self._sort_specs: List[tuple[str, int]] = []
        self._skip_count = 0
        self._limit_count: Optional[int] = None

    def sort(self, key_or_list: Union[str, List[tuple[str, int]]], direction: int = 1) -> "JSONCursor":
        if isinstance(key_or_list, str):
            self._sort_specs.append((key_or_list, direction))
        elif isinstance(key_or_list, list):
            self._sort_specs.extend(key_or_list)
        return self

    def skip(self, n: int) -> "JSONCursor":
        self._skip_count = max(0, n)
        return self

    def limit(self, n: int) -> "JSONCursor":
        self._limit_count = max(0, n) if n is not None else None
        return self

    async def to_list(self, length: Optional[int] = None) -> List[Dict[str, Any]]:
        docs = list(self._docs)

        # Apply multi-key sorting if specified
        if self._sort_specs:
            for key, direction in reversed(self._sort_specs):
                reverse = (direction == -1)

                def sort_key(doc: Dict[str, Any]):
                    val = doc.get(key)
                    if val is None:
                        return (1, "")
                    if isinstance(val, (int, float)):
                        return (0, val)
                    if isinstance(val, datetime):
                        return (0, val.isoformat())
                    return (0, str(val))

                docs.sort(key=sort_key, reverse=reverse)

        # Apply skip
        if self._skip_count > 0:
            docs = docs[self._skip_count:]

        # Apply limit
        limit_val = length if length is not None else self._limit_count
        if limit_val is not None:
            docs = docs[:limit_val]

        return [copy.deepcopy(d) for d in docs]

    def __aiter__(self):
        self._iter_index = 0
        return self

    async def __anext__(self):
        docs = await self.to_list()
        if self._iter_index < len(docs):
            doc = docs[self._iter_index]
            self._iter_index += 1
            return doc
        raise StopAsyncIteration


class JSONCollection:
    """Async file-backed JSON collection mimicking MongoDB collections."""

    def __init__(self, name: str, file_path: Path):
        self.name = name
        self.file_path = file_path
        self._lock = asyncio.Lock()
        self._ensure_file_exists()

    def _ensure_file_exists(self):
        self.file_path.parent.mkdir(parents=True, exist_ok=True)
        if not self.file_path.exists():
            with open(self.file_path, "w", encoding="utf-8") as f:
                json.dump([], f, indent=2)

    def _read_documents(self) -> List[Dict[str, Any]]:
        try:
            if not self.file_path.exists():
                return []
            with open(self.file_path, "r", encoding="utf-8") as f:
                raw_data = json.load(f)
                if not isinstance(raw_data, list):
                    return []
                return [deserialize_from_json(item) for item in raw_data]
        except Exception as e:
            logger.error(f"Error reading JSON collection {self.name}: {e}")
            return []

    def _write_documents(self, documents: List[Dict[str, Any]]):
        try:
            serialized = [serialize_for_json(doc) for doc in documents]
            temp_path = self.file_path.with_suffix(".tmp")
            with open(temp_path, "w", encoding="utf-8") as f:
                json.dump(serialized, f, indent=2, default=str)
            temp_path.replace(self.file_path)
        except Exception as e:
            logger.error(f"Error saving JSON collection {self.name}: {e}")
            raise

    @staticmethod
    def _matches_filter(doc: Dict[str, Any], query: Dict[str, Any]) -> bool:
        if not query:
            return True

        for k, v in query.items():
            if k == "$or":
                if not any(JSONCollection._matches_filter(doc, sub_q) for sub_q in v):
                    return False
                continue
            if k == "$and":
                if not all(JSONCollection._matches_filter(doc, sub_q) for sub_q in v):
                    return False
                continue

            doc_val = doc.get(k)

            # Handle MongoDB query operators like $in, $eq, $ne
            if isinstance(v, dict):
                if "$in" in v:
                    allowed = [str(x) for x in v["$in"]]
                    if str(doc_val) not in allowed and doc_val not in v["$in"]:
                        return False
                if "$eq" in v:
                    if str(doc_val) != str(v["$eq"]) and doc_val != v["$eq"]:
                        return False
                if "$ne" in v:
                    if str(doc_val) == str(v["$ne"]) or doc_val == v["$ne"]:
                        return False
                continue

            # Standard equality check (supporting ObjectId and string comparisons)
            if isinstance(v, ObjectId) or isinstance(doc_val, ObjectId):
                if str(doc_val) != str(v):
                    return False
            else:
                if doc_val != v:
                    return False

        return True

    async def find_one(self, filter_query: Optional[Dict[str, Any]] = None) -> Optional[Dict[str, Any]]:
        query = filter_query or {}
        async with self._lock:
            docs = self._read_documents()
            for doc in docs:
                if self._matches_filter(doc, query):
                    return copy.deepcopy(doc)
            return None

    def find(self, filter_query: Optional[Dict[str, Any]] = None) -> JSONCursor:
        query = filter_query or {}
        docs = self._read_documents()
        matched = [d for d in docs if self._matches_filter(d, query)]
        return JSONCursor(matched)

    async def insert_one(self, document: Dict[str, Any]) -> InsertOneResult:
        async with self._lock:
            docs = self._read_documents()
            new_doc = copy.deepcopy(document)

            if "_id" not in new_doc or new_doc["_id"] is None:
                new_doc["_id"] = ObjectId()
            elif isinstance(new_doc["_id"], str) and ObjectId.is_valid(new_doc["_id"]):
                new_doc["_id"] = ObjectId(new_doc["_id"])

            docs.append(new_doc)
            self._write_documents(docs)
            return InsertOneResult(inserted_id=new_doc["_id"])

    async def update_one(
        self,
        filter_query: Dict[str, Any],
        update_data: Dict[str, Any],
        upsert: bool = False
    ) -> UpdateResult:
        async with self._lock:
            docs = self._read_documents()
            matched_index = -1
            for i, doc in enumerate(docs):
                if self._matches_filter(doc, filter_query):
                    matched_index = i
                    break

            if matched_index >= 0:
                doc = docs[matched_index]
                if "$set" in update_data:
                    for k, v in update_data["$set"].items():
                        doc[k] = v
                else:
                    for k, v in update_data.items():
                        if not k.startswith("$"):
                            doc[k] = v
                self._write_documents(docs)
                return UpdateResult(matched_count=1, modified_count=1)

            if upsert:
                new_doc = {}
                for k, v in filter_query.items():
                    if not k.startswith("$"):
                        new_doc[k] = v

                if "$set" in update_data:
                    new_doc.update(update_data["$set"])
                else:
                    for k, v in update_data.items():
                        if not k.startswith("$"):
                            new_doc[k] = v

                if "_id" not in new_doc or new_doc["_id"] is None:
                    new_doc["_id"] = ObjectId()
                elif isinstance(new_doc["_id"], str) and ObjectId.is_valid(new_doc["_id"]):
                    new_doc["_id"] = ObjectId(new_doc["_id"])

                docs.append(new_doc)
                self._write_documents(docs)
                return UpdateResult(matched_count=0, modified_count=1, upserted_id=new_doc["_id"])

            return UpdateResult(matched_count=0, modified_count=0)

    async def delete_one(self, filter_query: Dict[str, Any]) -> DeleteResult:
        async with self._lock:
            docs = self._read_documents()
            matched_index = -1
            for i, doc in enumerate(docs):
                if self._matches_filter(doc, filter_query):
                    matched_index = i
                    break

            if matched_index >= 0:
                docs.pop(matched_index)
                self._write_documents(docs)
                return DeleteResult(deleted_count=1)
            return DeleteResult(deleted_count=0)

    async def count_documents(self, filter_query: Optional[Dict[str, Any]] = None) -> int:
        query = filter_query or {}
        async with self._lock:
            docs = self._read_documents()
            return sum(1 for d in docs if self._matches_filter(d, query))

    async def create_index(self, keys: Any, unique: bool = False) -> str:
        # Index creation is a safe no-op for JSON file storage
        return "idx_created"


class AdminMock:
    async def command(self, cmd: str) -> Dict[str, Any]:
        return {"ok": 1, "status": "JSON database is active and ready"}


class JSONDatabase:
    """Async database engine managing collections stored as JSON files."""

    def __init__(self, data_dir: Optional[Union[str, Path]] = None):
        if data_dir is None:
            # Default to <project_root>/data
            project_root = Path(__file__).resolve().parent.parent.parent
            data_dir = project_root / "data"
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(parents=True, exist_ok=True)
        self._collections: Dict[str, JSONCollection] = {}
        self.admin = AdminMock()

    def get_collection(self, name: str) -> JSONCollection:
        if name not in self._collections:
            file_path = self.data_dir / f"{name}.json"
            self._collections[name] = JSONCollection(name, file_path)
        return self._collections[name]

    def __getitem__(self, name: str) -> JSONCollection:
        return self.get_collection(name)

    def __getattr__(self, name: str) -> JSONCollection:
        if name.startswith("_"):
            raise AttributeError(f"'{self.__class__.__name__}' object has no attribute '{name}'")
        return self.get_collection(name)

    def close(self):
        logger.info("JSON Database closed.")
