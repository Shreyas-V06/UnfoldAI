from __future__ import annotations

from datetime import datetime
from typing import Annotated, Any

from bson import ObjectId
from fastapi import Depends

from app.core.database import get_database
from app.exceptions.handlers import EntityNotFoundException, DuplicateEntityException, AgentProcessingException
from app.models.exercise import ExerciseResponse
from app.models.exercise_result import SubmitExerciseRequest, SubmitExerciseResponse, ExerciseResultResponse, ImmediateFeedback
from app.repositories.exercise_repository import ExerciseRepository
from app.repositories.exercise_result_repository import ExerciseResultRepository
from app.repositories.student_repository import StudentRepository
from app.agents.graph import exercise_agent


class ExerciseService:
    """Service for handling exercises and grading."""

    def __init__(self, db: Any):
        self.db = db
        self.exercise_repo = ExerciseRepository(db)
        self.result_repo = ExerciseResultRepository(db)
        self.student_repo = StudentRepository(db)

    async def get_exercise(self, exercise_id: str) -> ExerciseResponse:
        """Get an exercise by ID."""
        doc = await self.exercise_repo.get_by_id(exercise_id)
        if not doc:
            raise EntityNotFoundException(f"Exercise with id {exercise_id} not found")
        return ExerciseResponse.model_validate(doc)

    async def submit_exercise(self, exercise_id: str, student_id: str, submission: SubmitExerciseRequest) -> SubmitExerciseResponse:
        """Submit an exercise for grading by the AI agent."""
        exercise = await self.exercise_repo.get_by_id(exercise_id)
        if not exercise:
            raise EntityNotFoundException(f"Exercise with id {exercise_id} not found")

        student = await self.student_repo.get_by_id(student_id)
        if not student:
            raise EntityNotFoundException(f"Student with id {student_id} not found")

        existing_result = await self.result_repo.get_by_student_and_exercise(student_id, exercise_id)

        agent_input = {
            "student_id": student_id,
            "exercise_id": exercise_id,
            "lesson_id": str(exercise["lesson_id"]),
            "exercise_type": exercise["type"],
            "exercise_content": exercise["content"],
            "exercise_title": exercise["title"],
            "submission": submission.submission_data,
            "db": self.db,
            "evaluation": {},
            "immediate_feedback": {},
            "current_memory": {},
            "updated_memory": {},
            "lesson_complete": False,
            "lesson_plan": {},
        }

        try:
            result = await exercise_agent.ainvoke(agent_input)
        except Exception as e:
            raise AgentProcessingException(f"Error processing exercise submission: {str(e)}")

        result_doc = {
            "student_id": ObjectId(student_id),
            "exercise_id": ObjectId(exercise_id),
            "lesson_id": ObjectId(str(exercise["lesson_id"])),
            "exercise_type": exercise["type"],
            "submission": submission.submission_data,
            "evaluation": result.get("evaluation", {}),
            "immediate_feedback": result.get("immediate_feedback", {}),
            "score": result.get("evaluation", {}).get("score", 0.0),
            "submitted_at": datetime.utcnow(),
        }

        if existing_result and "_id" in existing_result:
            saved = await self.result_repo.update(str(existing_result["_id"]), result_doc)
            if not saved:
                saved = await self.result_repo.create(result_doc)
        else:
            saved = await self.result_repo.create(result_doc)

        feedback_data = result.get("immediate_feedback") or {}
        return SubmitExerciseResponse(
            exercise_result=ExerciseResultResponse.model_validate(saved),
            immediate_feedback=ImmediateFeedback.model_validate(feedback_data)
        )

    async def get_results_for_lesson(self, student_id: str, lesson_id: str) -> list[ExerciseResultResponse]:
        """Get all exercise results for a student in a specific lesson."""
        results = await self.result_repo.get_by_student_and_lesson(student_id, lesson_id)
        return [ExerciseResultResponse.model_validate(r) for r in results]


async def get_exercise_service(db: Annotated[Any, Depends(get_database)]) -> ExerciseService:
    """Dependency factory for ExerciseService."""
    return ExerciseService(db)
