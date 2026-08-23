import json
import logging
from datetime import datetime, timezone
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_groq import ChatGroq

from app.core.config import settings
from app.agents.state import ExerciseAgentState
from app.agents.utils import parse_llm_json
from app.agents.prompts.lesson_plan import (
    LESSON_PLAN_SYSTEM_PROMPT,
    GENERATE_LESSON_PLAN_PROMPT
)

logger = logging.getLogger(__name__)

async def generate_lesson_plan(state: ExerciseAgentState) -> dict:
    db = state["db"]
    student_id = state["student_id"]
    updated_memory = state.get("updated_memory", {})
    
    # Load available lessons
    cursor = db["lessons"].find({"is_active": True})
    available_lessons = await cursor.to_list(length=100)
    
    # Load completed lesson IDs
    cursor = db["exercise_results"].find({"student_id": student_id})
    completed_results = await cursor.to_list(length=None)
    completed_lesson_ids = list(set(str(r.get("lesson_id")) for r in completed_results if r.get("lesson_id")))
    
    # Clean available lessons for prompt
    clean_lessons = [
        {"id": str(l.get("_id")), "title": l.get("title"), "description": l.get("description")} 
        for l in available_lessons
    ]
    
    formatted_prompt = GENERATE_LESSON_PLAN_PROMPT.format(
        student_memory_json=json.dumps(updated_memory, default=str),
        available_lessons_json=json.dumps(clean_lessons, default=str),
        completed_lesson_ids=json.dumps(completed_lesson_ids)
    )
    
    try:
        chat = ChatGroq(model=settings.GROQ_MODEL_NAME, api_key=settings.GROQ_API_KEY, temperature=0.3)
        messages = [
            SystemMessage(content=LESSON_PLAN_SYSTEM_PROMPT),
            HumanMessage(content=formatted_prompt)
        ]
        response = await chat.ainvoke(messages)
        plan_dict = parse_llm_json(response.content)
        if not plan_dict:
            raise ValueError("Empty plan returned from LLM")
    except Exception as e:
        logger.warning(f"Groq LLM generate_lesson_plan fallback used due to: {e}")
        # Next uncompleted lesson or first available
        remaining = [l for l in clean_lessons if l["id"] not in completed_lesson_ids]
        next_lesson = remaining[0]["id"] if remaining else (clean_lessons[0]["id"] if clean_lessons else "next_lesson")
        plan_dict = {
            "recommended_lessons": [next_lesson],
            "focus_areas": [
                {
                    "area": "Multi-sensory reading practice",
                    "priority": "medium",
                    "suggested_exercises": ["MCQ phonics", "Audio pronunciation chunking"]
                }
            ],
            "rationale": "Sequential curriculum progression reinforcing core dyslexia literacy skills.",
            "difficulty_adjustment": "maintain"
        }
    
    # Save lesson plan to DB
    plan_doc = {
        "student_id": student_id,
        "plan": plan_dict,
        "generated_at": datetime.now(timezone.utc)
    }
    
    await db["lesson_plans"].insert_one(plan_doc)
    
    return {"lesson_plan": plan_dict}
