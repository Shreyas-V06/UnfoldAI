"""Node to gather data for report."""
import logging
from typing import Any
from bson import ObjectId
from app.agents_report.state import ReportAgentState

logger = logging.getLogger(__name__)

async def gather_data(state: ReportAgentState) -> dict[str, Any]:
    """Gather data required for the report."""
    db = state["db"]
    student_id = state["student_id"]
    
    try:
        # 1. Load student info
        student_obj_id = ObjectId(student_id) if ObjectId.is_valid(student_id) else None
        filter_ids = [student_id]
        if student_obj_id:
            filter_ids.append(student_obj_id)

        student_info = await db["students"].find_one({"_id": {"$in": filter_ids}})
        if student_info:
            student_info["_id"] = str(student_info["_id"])
        else:
            student_info = {"name": "Student", "_id": str(student_id)}
            
        # 2. Load student memory
        memory_data = await db["student_memory"].find_one({"student_id": {"$in": filter_ids}})
        if memory_data:
            memory_data["_id"] = str(memory_data["_id"])
        else:
            memory_data = {
                "student_id": str(student_id),
                "strengths": [],
                "weaknesses": [],
                "misconceptions": [],
                "pronunciation_issues": [],
                "observations": []
            }
            
        # 3. Load all exercise results for the student
        cursor = db["exercise_results"].find({"student_id": {"$in": filter_ids}})
        exercise_results = await cursor.to_list(length=200)
            
        for doc in exercise_results:
            if "_id" in doc:
                doc["_id"] = str(doc["_id"])
            if "student_id" in doc:
                doc["student_id"] = str(doc["student_id"])
            if "exercise_id" in doc:
                doc["exercise_id"] = str(doc["exercise_id"])
            if "lesson_id" in doc:
                doc["lesson_id"] = str(doc["lesson_id"])
            
        # 4. Load recent lesson plans
        cursor = db["lesson_plans"].find({"student_id": {"$in": filter_ids}})
        lesson_plans = await cursor.to_list(length=10)
            
        for doc in lesson_plans:
            if "_id" in doc:
                doc["_id"] = str(doc["_id"])
            if "student_id" in doc:
                doc["student_id"] = str(doc["student_id"])
            
        return {
            "student_info": student_info,
            "memory_data": memory_data,
            "exercise_results": exercise_results,
            "lesson_plans": lesson_plans
        }
    except Exception as e:
        logger.error(f"Error gathering report data: {e}")
        return {
            "student_info": {"name": "Student", "_id": str(student_id)},
            "memory_data": {},
            "exercise_results": [],
            "lesson_plans": []
        }
