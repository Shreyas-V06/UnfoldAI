import json
import logging
from datetime import datetime, timezone
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_groq import ChatGroq

from app.core.config import settings
from app.agents.state import ExerciseAgentState
from app.agents.utils import parse_llm_json
from app.agents.prompts.memory import (
    MEMORY_SYSTEM_PROMPT,
    UPDATE_MEMORY_PROMPT
)

logger = logging.getLogger(__name__)

MAX_LIST_SIZE = 15


def _deduplicate_list(items: list[str], max_size: int = MAX_LIST_SIZE) -> list[str]:
    """Remove near-duplicate entries and cap list size."""
    if not items:
        return []

    seen_lower: list[str] = []
    unique: list[str] = []

    for item in items:
        item_str = str(item).strip()
        if not item_str:
            continue
        item_lower = item_str.lower()

        # Skip if duplicate or substring of existing
        is_dup = False
        for existing in seen_lower:
            if item_lower == existing or item_lower in existing or existing in item_lower:
                is_dup = True
                break
        if not is_dup:
            seen_lower.append(item_lower)
            unique.append(item_str)

    return unique[-max_size:]


def _extract_meaningful_insights(evaluation: dict, exercise_type: str, exercise_title: str) -> dict:
    """Extract actionable insights from evaluation data."""
    insights: dict = {
        "strengths": [],
        "weaknesses": [],
        "misconceptions": [],
        "pronunciation_issues": [],
        "observation": None,
    }

    analysis = evaluation.get("analysis", "")
    issues = evaluation.get("identified_issues", [])
    score = float(evaluation.get("score", 0))
    correct = evaluation.get("correct")

    # Categorize issues directly
    for issue in issues:
        issue_str = str(issue).strip()
        if not issue_str:
            continue

        if exercise_type == "audio":
            insights["pronunciation_issues"].append(issue_str)
        elif "misconception" in issue_str.lower() or "confus" in issue_str.lower():
            insights["misconceptions"].append(issue_str)
        else:
            insights["weaknesses"].append(issue_str)

    if score >= 80:
        insights["strengths"].append(f"Mastered: {exercise_title}")
        insights["observation"] = f"Demonstrated high mastery ({score}%) in {exercise_type} activity '{exercise_title}'."
    elif score < 50:
        short_issue = issues[0] if issues else "needs additional practice"
        insights["weaknesses"].append(f"Difficulty with '{exercise_title}': {short_issue}")
        insights["observation"] = f"Struggled with {exercise_type} exercise '{exercise_title}' (Score: {score}%). Gaps: {short_issue}."
    else:
        insights["observation"] = f"Completed {exercise_type} exercise '{exercise_title}' with score {score}%."

    return insights


async def update_memory(state: ExerciseAgentState) -> dict:
    db = state["db"]
    student_id = state["student_id"]
    evaluation = state.get("evaluation", {})
    exercise_type = state["exercise_type"]
    exercise_title = state.get("exercise_title", "")
    submission = state.get("submission", {})

    # Load memory from collection
    memory_doc = await db["student_memory"].find_one({
        "$or": [{"student_id": student_id}, {"student_id": str(student_id)}]
    })
    if not memory_doc:
        memory_doc = {
            "student_id": str(student_id),
            "strengths": [],
            "weaknesses": [],
            "misconceptions": [],
            "pronunciation_issues": [],
            "emotional_profile": {
                "overall_sentiment": "neutral",
                "observed_patterns": [],
                "triggers": [],
                "coping_strategies": []
            },
            "overall_progress": {},
            "observations": []
        }

    updated_memory = None
    if settings.GROQ_API_KEY and not settings.GROQ_API_KEY.startswith("gsk_test"):
        try:
            formatted_prompt = UPDATE_MEMORY_PROMPT.format(
                current_memory_json=json.dumps(memory_doc, default=str),
                new_evaluation_json=json.dumps(evaluation, default=str),
                exercise_type=exercise_type,
                exercise_title=exercise_title
            )
            chat = ChatGroq(model=settings.GROQ_MODEL_NAME, api_key=settings.GROQ_API_KEY, temperature=0.3)
            messages = [
                SystemMessage(content=MEMORY_SYSTEM_PROMPT),
                HumanMessage(content=formatted_prompt)
            ]
            response = await chat.ainvoke(messages)
            updated_memory = parse_llm_json(response.content)
        except Exception as e:
            logger.warning(f"Groq LLM update_memory error, using dynamic extractor: {e}")

    if not updated_memory or not isinstance(updated_memory, dict):
        insights = _extract_meaningful_insights(evaluation, exercise_type, exercise_title)
        updated_memory = dict(memory_doc)

        for key in ("strengths", "weaknesses", "misconceptions", "pronunciation_issues"):
            existing = list(updated_memory.get(key, []))
            existing.extend(insights.get(key, []))
            updated_memory[key] = existing

        if insights["observation"]:
            updated_memory["new_ai_observation"] = insights["observation"]

        # Emotional profile update for emotional exercises
        if exercise_type == "emotional":
            selected_emotion = submission.get("selected_emotion", "")
            current_em = updated_memory.get("emotional_profile", {})
            if isinstance(current_em, str):
                current_em = {"overall_sentiment": "neutral", "coping_strategies": []}
            if selected_emotion:
                current_em["overall_sentiment"] = selected_emotion
                strategies = current_em.get("coping_strategies", [])
                strategies.append(f"Identified feelings: {selected_emotion}")
                current_em["coping_strategies"] = _deduplicate_list(strategies)
            updated_memory["emotional_profile"] = current_em

    # Deduplicate lists
    for key in ("strengths", "weaknesses", "misconceptions", "pronunciation_issues"):
        updated_memory[key] = _deduplicate_list(updated_memory.get(key, []))

    updated_memory["student_id"] = str(student_id)
    updated_memory["last_updated"] = datetime.now(timezone.utc)

    if updated_memory.get("new_ai_observation"):
        obs_text = updated_memory["new_ai_observation"]
        if obs_text:
            observation = {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "text": obs_text
            }
            observations = list(memory_doc.get("observations", []))
            observations.append(observation)
            updated_memory["observations"] = observations[-30:]

    # Upsert to database
    await db["student_memory"].update_one(
        {"$or": [{"student_id": student_id}, {"student_id": str(student_id)}]},
        {"$set": updated_memory},
        upsert=True
    )

    return {"current_memory": memory_doc, "updated_memory": updated_memory}
