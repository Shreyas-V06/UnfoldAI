from fastapi import APIRouter, status

from app.models.course import CourseGenerateRequest, CourseGenerateResponse
from app.services.course_service import CourseService

router = APIRouter(prefix="/courses", tags=["Courses"])

_course_service = CourseService()


@router.post("/generate", response_model=CourseGenerateResponse, status_code=status.HTTP_200_OK)
async def generate_course(request: CourseGenerateRequest):
    """Search YouTube for educational videos related to a topic.

    Returns a list of video titles and links.
    """
    return await _course_service.generate_course(
        topic=request.topic,
        max_results=request.max_results,
    )
