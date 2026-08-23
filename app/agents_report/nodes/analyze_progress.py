"""Node to analyze student progress in real-time from actual exercise performance & memory."""
import json
import logging
import re
from typing import Any
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_groq import ChatGroq
from app.agents_report.state import ReportAgentState
from app.core.config import settings

logger = logging.getLogger(__name__)

REPORT_ANALYSIS_SYSTEM_PROMPT = """You are an expert AI educator and clinical specialist in dyslexia and neurodivergent learning.
Analyze the student's actual performance data, cognitive memory, and exercise results.
Output your analysis strictly in JSON format."""

ANALYZE_PROGRESS_PROMPT = """Analyze the following student data for the {period} period.

Student Info: {student_info}
Memory Data: {memory_data}
Exercise Results: {exercise_results}
Lesson Plans: {lesson_plans}

Provide your analysis as a JSON object with these keys:
{{
  "score_trends": "A summary string of the general trends in scores and accuracy.",
  "strength_patterns": ["List of strings detailing verified areas of strength."],
  "weakness_patterns": ["List of strings detailing specific areas for improvement."],
  "emotional_trajectory": "A string describing the student's emotional state over time.",
  "areas_of_improvement": ["List of strings for specific areas where they've improved."],
  "areas_of_concern": ["List of strings for specific areas of concern."]
}}
"""

def extract_json(text: str) -> dict[str, Any]:
    """Extract JSON from LLM response."""
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    
    match = re.search(r'```(?:json)?(.*?)```', text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(1).strip())
        except json.JSONDecodeError:
            pass
    
    return {}

async def analyze_progress(state: ReportAgentState) -> dict[str, Any]:
    """Analyze the gathered student progress data against real memory & results."""
    student_info = state.get("student_info", {})
    memory_data = state.get("memory_data", {})
    exercise_results = state.get("exercise_results", [])
    lesson_plans = state.get("lesson_plans", [])
    
    analysis_dict = None
    if settings.GROQ_API_KEY and not settings.GROQ_API_KEY.startswith("gsk_test"):
        try:
            prompt = ANALYZE_PROGRESS_PROMPT.format(
                period=state.get("period", "overall"),
                student_info=json.dumps(student_info, default=str),
                memory_data=json.dumps(memory_data, default=str),
                exercise_results=json.dumps(exercise_results[:50], default=str),
                lesson_plans=json.dumps(lesson_plans[:10], default=str)
            )
            llm = ChatGroq(model=settings.GROQ_MODEL_NAME, api_key=settings.GROQ_API_KEY, temperature=0.3)
            messages = [
                SystemMessage(content=REPORT_ANALYSIS_SYSTEM_PROMPT),
                HumanMessage(content=prompt)
            ]
            response = await llm.ainvoke(messages)
            analysis_dict = extract_json(response.content)
        except Exception as e:
            logger.warning(f"Groq LLM analyze_progress error, using real-time memory analysis: {e}")

    # Compute real-time analytics directly from student's actual performance history
    scores = [float(r.get("score", 0)) for r in exercise_results if "score" in r]
    total_count = len(scores)
    avg_score = round(sum(scores) / total_count, 1) if total_count > 0 else 0.0

    # Categorize by exercise type
    mcq_scores = [float(r.get("score", 0)) for r in exercise_results if r.get("exercise_type") == "mcq"]
    audio_scores = [float(r.get("score", 0)) for r in exercise_results if r.get("exercise_type") == "audio"]
    sit_scores = [float(r.get("score", 0)) for r in exercise_results if r.get("exercise_type") == "situational"]
    emo_scores = [float(r.get("score", 0)) for r in exercise_results if r.get("exercise_type") == "emotional"]

    # Gather real issues identified across exercise results
    result_issues = []
    for r in exercise_results:
        eval_data = r.get("evaluation", {})
        for issue in eval_data.get("identified_issues", []):
            if issue and issue not in result_issues:
                result_issues.append(str(issue))

    mem_strengths = memory_data.get("strengths", [])
    mem_weaknesses = memory_data.get("weaknesses", [])
    mem_misconceptions = memory_data.get("misconceptions", [])
    mem_pronunciation = memory_data.get("pronunciation_issues", [])

    all_strengths = list(mem_strengths)
    if not all_strengths:
        if mcq_scores and (sum(mcq_scores) / len(mcq_scores)) >= 80:
            all_strengths.append("High accuracy in multiple-choice phonics recognition")
        if emo_scores:
            all_strengths.append("Active emotional reflection and self-awareness")
        if not all_strengths:
            all_strengths.append("Eager participation in multimodal learning exercises")

    all_weaknesses = list(mem_weaknesses) + list(mem_misconceptions) + list(mem_pronunciation) + result_issues
    # Deduplicate
    unique_weaknesses = []
    for w in all_weaknesses:
        if w and w not in unique_weaknesses:
            unique_weaknesses.append(w)

    if not unique_weaknesses:
        unique_weaknesses.append("Continuous oral reading fluency reinforcement")

    # Score trend narrative
    if total_count == 0:
        score_trends = "Initial baseline assessment pending. No completed exercises logged yet."
    else:
        type_summaries = []
        if mcq_scores:
            type_summaries.append(f"MCQ: {round(sum(mcq_scores)/len(mcq_scores), 1)}%")
        if audio_scores:
            type_summaries.append(f"Audio/Voice: {round(sum(audio_scores)/len(audio_scores), 1)}%")
        if sit_scores:
            type_summaries.append(f"Situational: {round(sum(sit_scores)/len(sit_scores), 1)}%")
        if emo_scores:
            type_summaries.append(f"Emotional: {round(sum(emo_scores)/len(emo_scores), 1)}%")

        breakdown = f" ({', '.join(type_summaries)})" if type_summaries else ""
        score_trends = f"Student completed {total_count} exercises with an overall average score of {avg_score}%{breakdown}."

    emotional_profile = memory_data.get("emotional_profile", {})
    sentiment = emotional_profile.get("overall_sentiment", "reflective") if isinstance(emotional_profile, dict) else "reflective"
    emotional_trajectory = f"Demonstrates {sentiment} emotional engagement and positive persistence during interactive tasks."

    if not analysis_dict or "score_trends" not in analysis_dict:
        analysis_dict = {
            "score_trends": score_trends,
            "strength_patterns": all_strengths[:5],
            "weakness_patterns": unique_weaknesses[:5],
            "emotional_trajectory": emotional_trajectory,
            "areas_of_improvement": [f"Targeted mastery in {w}" for w in unique_weaknesses[:3]],
            "areas_of_concern": unique_weaknesses[:3]
        }
        
    return {"progress_analysis": analysis_dict}
