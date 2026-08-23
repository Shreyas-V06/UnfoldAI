from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional
from app.models.common import PyObjectId, TimestampMixin

class StudentProfile(BaseModel):
    learning_style: Optional[str] = None
    preferred_difficulty: Optional[str] = None
    notes: Optional[str] = None

class StudentCreate(BaseModel):
    name: str
    email: EmailStr
    age: int = Field(ge=4, le=18)
    grade: str
    profile: Optional[StudentProfile] = None

class StudentUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    age: Optional[int] = Field(default=None, ge=4, le=18)
    grade: Optional[str] = None
    profile: Optional[StudentProfile] = None

class StudentInDB(TimestampMixin, StudentCreate):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    
    model_config = ConfigDict(populate_by_name=True, arbitrary_types_allowed=True)

class StudentResponse(BaseModel):
    id: PyObjectId = Field(alias="_id")
    name: str
    email: EmailStr
    age: int
    grade: str
    profile: Optional[StudentProfile] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    model_config = ConfigDict(populate_by_name=True, arbitrary_types_allowed=True)
