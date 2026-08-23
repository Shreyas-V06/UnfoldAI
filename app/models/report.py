from datetime import datetime
from typing import List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict
from app.models.common import PyObjectId

class ReportFinding(BaseModel):
    category: str = "General"
    finding: str = ""
    severity: str = "info"

    model_config = ConfigDict(populate_by_name=True, arbitrary_types_allowed=True)

class ReportCreate(BaseModel):
    student_id: PyObjectId
    period: str = "overall"
    summary: Dict[str, Any] = Field(default_factory=dict)
    detailed_findings: List[ReportFinding] = Field(default_factory=list)
    recommendations: List[str] = Field(default_factory=list)

    model_config = ConfigDict(arbitrary_types_allowed=True)

class ReportInDB(ReportCreate):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    generated_at: datetime = Field(default_factory=datetime.utcnow)
    
    model_config = ConfigDict(populate_by_name=True, arbitrary_types_allowed=True)

class ReportResponse(ReportInDB):
    pass
