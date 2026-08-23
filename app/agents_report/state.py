"""State definition for the report agent."""
from typing import Any, TypedDict

class ReportAgentState(TypedDict):
    student_id: str
    period: str  # e.g. "weekly", "monthly", "custom"
    db: Any  # AsyncIOMotorDatabase
    
    # Gathered data
    student_info: dict[str, Any]
    memory_data: dict[str, Any]
    exercise_results: list[dict[str, Any]]
    lesson_plans: list[dict[str, Any]]
    
    # Analysis
    progress_analysis: dict[str, Any]
    
    # Final report
    report: dict[str, Any]
