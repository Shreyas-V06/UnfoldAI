from enum import Enum
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict, model_validator
from app.models.common import PyObjectId, TimestampMixin

class ExerciseType(str, Enum):
    AUDIO = "audio"
    MCQ = "mcq"
    EMOTIONAL = "emotional"
    SITUATIONAL = "situational"

class AudioContent(BaseModel):
    audio_description: str
    target_text: str
    pronunciation_guide: Optional[str] = None

class MCQContent(BaseModel):
    question: str
    options: List[str] = Field(min_length=2, max_length=6)
    correct_answer_index: int
    explanation: str

class EmotionalContent(BaseModel):
    scenario_description: str
    emotion_context: str
    expected_response_type: str = "text"
    guiding_questions: List[str] = Field(default_factory=list)

class SituationalContent(BaseModel):
    situation: str
    context: str
    expected_skills: List[str]
    difficulty_hint: Optional[str] = None

class ExerciseCreate(BaseModel):
    """Schema for creating a new exercise."""

    lesson_id: PyObjectId
    type: ExerciseType
    title: str
    content: Dict[str, Any]
    order: int = Field(ge=1)

    model_config = ConfigDict(arbitrary_types_allowed=True)

    @model_validator(mode="after")
    def validate_content(self):
        content_map = {
            ExerciseType.AUDIO: AudioContent,
            ExerciseType.MCQ: MCQContent,
            ExerciseType.EMOTIONAL: EmotionalContent,
            ExerciseType.SITUATIONAL: SituationalContent
        }
        model = content_map.get(self.type)
        if model:
            model(**self.content)
        return self

class ExerciseUpdate(BaseModel):
    """Schema for updating an exercise."""

    lesson_id: Optional[PyObjectId] = None
    type: Optional[ExerciseType] = None
    title: Optional[str] = None
    content: Optional[Dict[str, Any]] = None
    order: Optional[int] = Field(default=None, ge=1)

    model_config = ConfigDict(arbitrary_types_allowed=True)

class ExerciseInDB(TimestampMixin, ExerciseCreate):
    id: PyObjectId = Field(alias="_id")
    
    model_config = ConfigDict(populate_by_name=True, arbitrary_types_allowed=True)

class ExerciseResponse(ExerciseCreate):
    id: PyObjectId = Field(alias="_id")
    created_at: datetime

    model_config = ConfigDict(populate_by_name=True, arbitrary_types_allowed=True)
