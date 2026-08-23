from fastapi import APIRouter, Depends, Query, status
from typing import Annotated

from app.models.report import ReportResponse
from app.services.report_service import ReportService, get_report_service

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.post("/generate/{student_id}", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
async def generate_student_report(
    student_id: str,
    report_service: Annotated[ReportService, Depends(get_report_service)],
    period: str = Query("overall")
):
    """Trigger the AI agent to generate a progress report for a student."""
    return await report_service.generate_report(student_id, period)

@router.get("/{student_id}", response_model=list[ReportResponse])
async def list_student_reports(
    student_id: str,
    report_service: Annotated[ReportService, Depends(get_report_service)],
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100)
):
    """List all reports for a student."""
    return await report_service.list_reports(student_id, skip, limit)

@router.get("/{student_id}/{report_id}", response_model=ReportResponse)
async def get_specific_report(
    student_id: str,
    report_id: str,
    report_service: Annotated[ReportService, Depends(get_report_service)]
):
    """Get a specific report for a student by ID."""
    return await report_service.get_report(student_id, report_id)
