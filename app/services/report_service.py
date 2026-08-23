from __future__ import annotations

from typing import Annotated, Any

from fastapi import Depends

from app.core.database import get_database
from app.exceptions.handlers import EntityNotFoundException, AgentProcessingException
from app.models.report import ReportResponse
from app.repositories.report_repository import ReportRepository
from app.repositories.student_repository import StudentRepository
from app.agents_report.graph import report_agent


class ReportService:
    """Service for handling report generation and retrieval."""

    def __init__(self, db: Any):
        self.db = db
        self.report_repo = ReportRepository(db)
        self.student_repo = StudentRepository(db)

    async def generate_report(self, student_id: str, period: str = "overall") -> ReportResponse:
        """Trigger AI agent to generate a progress report."""
        student = await self.student_repo.get_by_id(student_id)
        if not student:
            raise EntityNotFoundException(f"Student with id {student_id} not found")

        agent_input = {
            "student_id": student_id,
            "period": period,
            "db": self.db,
            "student_info": {},
            "memory_data": {},
            "exercise_results": [],
            "lesson_plans": [],
            "progress_analysis": {},
            "report": {},
        }

        try:
            result = await report_agent.ainvoke(agent_input)
            report_data = result.get("report")
            if not report_data:
                raise ValueError("Report generation returned empty data")
        except Exception as e:
            raise AgentProcessingException(f"Error generating report: {str(e)}")

        return ReportResponse.model_validate(report_data)

    async def list_reports(self, student_id: str, skip: int = 0, limit: int = 10) -> list[ReportResponse]:
        """List all reports for a student."""
        reports = await self.report_repo.get_by_student(student_id, skip, limit)
        return [ReportResponse.model_validate(r) for r in reports]

    async def get_report(self, student_id: str, report_id: str) -> ReportResponse:
        """Get a specific report for a student."""
        report = await self.report_repo.get_by_id(report_id)
        if not report:
            raise EntityNotFoundException(f"Report with id {report_id} not found")
        # Optional check: ensure report belongs to student
        if str(report.get("student_id")) != student_id:
            raise EntityNotFoundException(f"Report with id {report_id} not found for student {student_id}")
            
        return ReportResponse.model_validate(report)


async def get_report_service(db: Annotated[Any, Depends(get_database)]) -> ReportService:
    """Dependency factory for ReportService."""
    return ReportService(db)
