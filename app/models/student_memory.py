from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict
from app.models.common import PyObjectId

class AIObservation(BaseModel):
    observation: str
    source_exercise_id: Optional[str] = None
    timestamp: datetime

class EmotionalProfile(BaseModel):
    overall_sentiment: str = "neutral"
    observed_patterns: List[str] = Field(default_factory=list)
    triggers: List[str] = Field(default_factory=list)
    coping_strategies: List[str] = Field(default_factory=list)

class LessonProgress(BaseModel):
    lesson_id: str
    lesson_title: str
    average_score: float
    completed_at: datetime

class StudentMemoryInDB(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    student_id: PyObjectId
    strengths: List[str] = Field(default_factory=list)
    weaknesses: List[str] = Field(default_factory=list)
    misconceptions: List[str] = Field(default_factory=list)
    pronunciation_issues: List[str] = Field(default_factory=list)
    emotional_profile: EmotionalProfile = Field(default_factory=EmotionalProfile)
    completed_lessons: List[LessonProgress] = Field(default_factory=list)
    overall_progress: Dict[str, Any] = Field(default_factory=dict)
    ai_observations: List[AIObservation] = Field(default_factory=list)
    last_updated: datetime = Field(default_factory=datetime.utcnow)
    
    model_config = ConfigDict(populate_by_name=True, arbitrary_types_allowed=True)

class StudentMemoryResponse(StudentMemoryInDB):
    pass

class StudentMemoryCreate(BaseModel):
    student_id: PyObjectId

    model_config = ConfigDict(arbitrary_types_allowed=True)

    @classmethod
    def create_empty(cls, student_id: Any) -> dict:
        return {
            "_id": PyObjectId(),
            "student_id": student_id,
            "strengths": [],
            "weaknesses": [],
            "misconceptions": [],
            "pronunciation_issues": [],
            "emotional_profile": EmotionalProfile().model_dump(),
            "completed_lessons": [],
            "overall_progress": {},
            "ai_observations": [],
            "last_updated": datetime.utcnow()
        }
