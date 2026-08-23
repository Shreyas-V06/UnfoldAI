from pydantic import BaseModel, Field
from typing import List


class CourseGenerateRequest(BaseModel):
    """Request body for course generation."""
    topic: str = Field(..., min_length=2, max_length=200, description="Topic to search for educational YouTube videos")
    max_results: int = Field(default=5, ge=1, le=15, description="Maximum number of videos to return")


class CourseVideo(BaseModel):
    """A single YouTube video result."""
    title: str
    link: str


class CourseGenerateResponse(BaseModel):
    """Response containing discovered YouTube videos for a topic."""
    topic: str
    videos: List[CourseVideo]
