from typing import TypedDict, Any, Dict

class ExerciseAgentState(TypedDict):
    # Input fields
    student_id: str
    exercise_id: str
    lesson_id: str
    exercise_type: str
    exercise_content: Dict[str, Any]
    exercise_title: str
    submission: Dict[str, Any]
    
    # Database dependency
    db: Any
    
    # Evaluation output
    evaluation: Dict[str, Any]
    
    # Feedback output
    immediate_feedback: Dict[str, Any]
    
    # Memory fields
    current_memory: Dict[str, Any]
    updated_memory: Dict[str, Any]
    
    # Lesson completion
    lesson_complete: bool
    
    # Lesson plan
    lesson_plan: Dict[str, Any]
