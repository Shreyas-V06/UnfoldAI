from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict
from app.models.common import PyObjectId

class FocusArea(BaseModel):
    area: str
    priority: str = "medium"
    suggested_exercises: List[str] = Field(default_factory=list)

class LessonPlanCreate(BaseModel):
    student_id: PyObjectId
    recommended_lessons: List[str] = Field(default_factory=list)
    focus_areas: List[FocusArea] = Field(default_factory=list)
    rationale: str
    difficulty_adjustment: str = "maintain"

    model_config = ConfigDict(arbitrary_types_allowed=True)

class LessonPlanInDB(LessonPlanCreate):
    id: PyObjectId = Field(alias="_id")
    generated_at: datetime
    
    model_config = ConfigDict(populate_by_name=True, arbitrary_types_allowed=True)

class LessonPlanResponse(LessonPlanInDB):
    pass
