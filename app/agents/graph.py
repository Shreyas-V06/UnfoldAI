from langgraph.graph import StateGraph, START, END

from app.agents.state import ExerciseAgentState
from app.agents.nodes.evaluate_submission import evaluate_submission
from app.agents.nodes.generate_feedback import generate_feedback
from app.agents.nodes.update_memory import update_memory
from app.agents.nodes.check_lesson_complete import check_lesson_complete, route_after_lesson_check
from app.agents.nodes.generate_lesson_plan import generate_lesson_plan

def build_exercise_agent_graph():
    builder = StateGraph(ExerciseAgentState)
    
    builder.add_node("evaluate_submission", evaluate_submission)
    builder.add_node("generate_feedback", generate_feedback)
    builder.add_node("update_memory", update_memory)
    builder.add_node("check_lesson_complete", check_lesson_complete)
    builder.add_node("generate_lesson_plan", generate_lesson_plan)
    
    builder.add_edge(START, "evaluate_submission")
    builder.add_edge("evaluate_submission", "generate_feedback")
    builder.add_edge("generate_feedback", "update_memory")
    builder.add_edge("update_memory", "check_lesson_complete")
    
    builder.add_conditional_edges("check_lesson_complete", route_after_lesson_check)
    
    builder.add_edge("generate_lesson_plan", END)
    
    return builder.compile()

exercise_agent = build_exercise_agent_graph()
