from enum import Enum
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any
from app.models.common import PyObjectId, TimestampMixin

class DifficultyLevel(str, Enum):
    BEGINNER = "BEGINNER"
    INTERMEDIATE = "INTERMEDIATE"
    ADVANCED = "ADVANCED"

class LessonCreate(BaseModel):
    title: str
    description: str
    subject: str
    difficulty_level: DifficultyLevel
    order: int = Field(ge=1)
    is_active: bool = True

class LessonUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    subject: Optional[str] = None
    difficulty_level: Optional[DifficultyLevel] = None
    order: Optional[int] = Field(default=None, ge=1)
    is_active: Optional[bool] = None

class LessonInDB(TimestampMixin, LessonCreate):
    id: PyObjectId = Field(alias="_id")
    
    model_config = ConfigDict(populate_by_name=True, arbitrary_types_allowed=True)

class LessonResponse(LessonCreate):
    id: PyObjectId = Field(alias="_id")
    created_at: datetime
    
    model_config = ConfigDict(populate_by_name=True, arbitrary_types_allowed=True)

class LessonDetailResponse(LessonResponse):
    exercises: List[Any] = Field(default_factory=list)
    
    model_config = ConfigDict(populate_by_name=True, arbitrary_types_allowed=True)
