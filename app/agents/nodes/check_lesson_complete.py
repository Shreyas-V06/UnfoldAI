from app.agents.state import ExerciseAgentState

async def check_lesson_complete(state: ExerciseAgentState) -> dict:
    db = state["db"]
    student_id = state["student_id"]
    lesson_id = state["lesson_id"]
    
    total_exercises = await db["exercises"].count_documents({"lesson_id": lesson_id})
    
    completed_results = await db["exercise_results"].count_documents({
        "student_id": student_id,
        "lesson_id": lesson_id
    })
    
    # completed_results already includes the current submission if saved before workflow
    # If workflow runs before save, might need +1. Assuming standard logic where DB triggers agent 
    # or agent runs and then saves. 
    # The instructions say: "(note: current submission adds 1 to completed count since it was just saved)"
    
    is_complete = total_exercises > 0 and completed_results >= total_exercises
    
    return {"lesson_complete": is_complete}

def route_after_lesson_check(state: ExerciseAgentState) -> str:
    if state.get("lesson_complete", False):
        return "generate_lesson_plan"
    return "__end__"
