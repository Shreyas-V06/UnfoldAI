from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict
from app.models.common import PyObjectId, TimestampMixin

class ExerciseSubmission(BaseModel):
    student_id: PyObjectId
    exercise_id: PyObjectId
    lesson_id: PyObjectId
    submission_data: Dict[str, Any]

    model_config = ConfigDict(arbitrary_types_allowed=True)

class EvaluationResult(BaseModel):
    score: float = Field(ge=0, le=100)
    correct: Optional[bool] = None
    analysis: str
    identified_issues: List[str] = Field(default_factory=list)

class ImmediateFeedback(BaseModel):
    summary: str = ""
    strengths: List[str] = Field(default_factory=list)
    areas_to_improve: List[str] = Field(default_factory=list)
    specific_tips: List[str] = Field(default_factory=list)
    encouragement: str = ""

    model_config = ConfigDict(populate_by_name=True, arbitrary_types_allowed=True)

class ExerciseResultInDB(BaseModel):
    id: PyObjectId = Field(alias="_id")
    student_id: PyObjectId
    exercise_id: PyObjectId
    lesson_id: PyObjectId
    exercise_type: str
    submission: Dict[str, Any]
    evaluation: Dict[str, Any]
    immediate_feedback: Dict[str, Any]
    score: float
    submitted_at: datetime
    
    model_config = ConfigDict(populate_by_name=True, arbitrary_types_allowed=True)

class ExerciseResultResponse(ExerciseResultInDB):
    pass

class SubmitExerciseRequest(BaseModel):
    submission_data: Dict[str, Any]

class SubmitExerciseResponse(BaseModel):
    exercise_result: ExerciseResultResponse
    immediate_feedback: ImmediateFeedback
    
    model_config = ConfigDict(populate_by_name=True, arbitrary_types_allowed=True)
