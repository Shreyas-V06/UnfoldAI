import logging
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_groq import ChatGroq

from app.core.config import settings
from app.agents.state import ExerciseAgentState
from app.agents.utils import parse_llm_json
from app.agents.prompts.feedback import (
    FEEDBACK_SYSTEM_PROMPT,
    GENERATE_FEEDBACK_PROMPT
)

logger = logging.getLogger(__name__)

async def generate_feedback(state: ExerciseAgentState) -> dict:
    evaluation = state.get("evaluation", {})
    score = float(evaluation.get("score", 0))
    analysis = evaluation.get("analysis", "")
    issues = evaluation.get("identified_issues", [])
    exercise_type = state["exercise_type"]
    exercise_title = state.get("exercise_title", "")
    submission_data = state.get("submission_data", {})
    
    video_analysis = submission_data.get("video_analysis", {})
    audio_analysis = submission_data.get("audio_analysis", {})
    
    formatted_prompt = GENERATE_FEEDBACK_PROMPT.format(
        exercise_type=exercise_type,
        exercise_title=exercise_title,
        evaluation_analysis=analysis,
        score=score,
        identified_issues=issues
    )
    
    feedback_dict = None
    if settings.GROQ_API_KEY and not settings.GROQ_API_KEY.startswith("gsk_test") and "placeholder" not in settings.GROQ_API_KEY.lower():
        try:
            chat = ChatGroq(model=settings.GROQ_MODEL_NAME, api_key=settings.GROQ_API_KEY, temperature=0.3)
            messages = [
                SystemMessage(content=FEEDBACK_SYSTEM_PROMPT),
                HumanMessage(content=formatted_prompt)
            ]
            response = await chat.ainvoke(messages)
            feedback_dict = parse_llm_json(response.content)
        except Exception as e:
            logger.warning(f"Groq LLM feedback error, using dynamic generator: {e}")

    if not feedback_dict or "summary" not in feedback_dict:
        # Multimodal Video & Audio customized remarks
        if exercise_type == "audio" and (video_analysis or audio_analysis):
            wpm = round(audio_analysis.get("linguistic", {}).get("words_per_minute", 90.0))
            face_presence = round(video_analysis.get("face_presence_ratio", 0.95) * 100) if video_analysis else 95
            blink_rate = round(video_analysis.get("eyes", {}).get("blink_rate_per_minute", 14.0)) if video_analysis else 14
            expression = video_analysis.get("expression", {}).get("dominant", "focused") if video_analysis else "focused"
            visual_state = video_analysis.get("visual_state", "relatively_stable_visual_behavior").replace("_", " ") if video_analysis else "stable"
            
            if score >= 80:
                summary = f"Brilliant oral reading on '{exercise_title}'! Clear speech ({wpm} WPM) with steady visual engagement ({face_presence}% focus)."
                strengths = [
                    f"Accurate oral pronunciation with fluent pacing ({wpm} WPM)",
                    f"Strong visual focus and eye contact ({face_presence}% face engagement)",
                    f"Relaxed reading posture with steady blink rate ({blink_rate}/min)"
                ]
                areas = []
                tips = [
                    "Keep up this confident pacing! Try reading longer paragraphs with the same rhythm.",
                    "Use the magnifier reading ruler to track sentence transitions smoothly."
                ]
                encouragement = "Superb multimodal performance! Your pronunciation and visual focus are exceptional. 🌟"
            elif score >= 50:
                summary = f"Good reading effort on '{exercise_title}' ({wpm} WPM). Observable visual engagement was {expression}."
                strengths = [
                    f"Good voice projection and steady pacing ({wpm} WPM)",
                    f"Consistent eye engagement with the target text ({face_presence}% focus)",
                    f"Maintained an attentive, {expression} expression"
                ]
                areas = issues if issues else ["Refining multi-syllable phoneme blending"]
                tips = [
                    "Tap your fingers on the desk for each syllable sound before saying the full word.",
                    "Use the reading ruler tool to keep your eyes locked on the active line of text."
                ]
                encouragement = "You are making steady progress! Keep practicing with rhythm and confidence."
            else:
                summary = f"Reading practice logged for '{exercise_title}'. Visual focus remained active ({face_presence}%)."
                strengths = [
                    f"Active participation with video & audio capture ({face_presence}% engagement)",
                    "Attempted oral reading passage"
                ]
                areas = issues if issues else ["Closer alignment between spoken words and target text"]
                tips = [
                    "Listen to the AI audio speaker button first, then read along with the target words.",
                    "Break difficult words into smaller 2-letter or 3-letter syllable chunks."
                ]
                encouragement = "Every repetition builds stronger neural pathways. Take a deep breath and give it another try!"
        elif score >= 85:
            summary = f"Outstanding work on '{exercise_title}'!"
            strengths = ["Strong comprehension and accuracy", "Clear and effective expression"]
            areas = []
            tips = ["Keep applying these multi-sensory techniques in your daily learning."]
            encouragement = "Fantastic progress! Your confidence and mastery are shining through. 🌟"
        elif score >= 60:
            summary = f"Good attempt on '{exercise_title}'!"
            strengths = ["Good effort in addressing the activity", "Demonstrated foundational understanding"]
            areas = issues if issues else ["Refining specific details and reasoning"]
            tips = ["Break complex concepts into smaller visual steps before answering."]
            encouragement = "You are making steady progress! Practice makes learning smoother every day."
        elif score >= 30:
            summary = f"Keep trying! Let's work on '{exercise_title}' together."
            strengths = ["Willingness to attempt challenging exercises"]
            areas = issues if issues else ["Connecting response more directly to the prompt"]
            tips = ["Try reading the question aloud and highlighting the key words before responding."]
            encouragement = "Every effort trains your learning brain. Take your time, you've got this!"
        else:
            summary = f"Let's review '{exercise_title}'."
            strengths = ["Started the exercise"]
            areas = issues if issues else ["Response was off-topic or incomplete"]
            tips = ["Make sure to address the specific problem or read the exact words shown on screen."]
            encouragement = "Don't worry about mistakes—they are the stepping stones to learning. Try again!"

        feedback_dict = {
            "summary": summary,
            "strengths": strengths,
            "areas_to_improve": areas,
            "specific_tips": tips,
            "encouragement": encouragement
        }
        
    return {"immediate_feedback": feedback_dict}
