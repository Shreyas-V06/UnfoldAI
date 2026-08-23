"""Service for the per-lesson chatbot with live active webpage exercise grounding."""
import json
import logging
import re
from typing import Any, Optional

from bson import ObjectId
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from langchain_groq import ChatGroq

from app.core.config import settings
from app.models.chat import ChatRequest, ChatResponse

logger = logging.getLogger(__name__)

CHATBOT_SYSTEM_TEMPLATE = """You are Unfold AI Tutor, a warm, patient, and encouraging learning companion for a dyslexic student.
You are currently helping the student with the lesson: "{lesson_title}" — {lesson_description}.

============================================================
🎯 CURRENT EXERCISE CURRENTLY ACTIVE ON THE STUDENT'S SCREEN:
============================================================
{active_exercise_details}
============================================================

ALL EXERCISES IN THIS CURRICULUM LESSON:
{exercises_context}

PEDAGOGICAL GUIDELINES:
- When the student asks "Give me a clue", "Explain in simpler words", "Help me with this", or asks about "this question/word", prioritize the CURRENT EXERCISE ACTIVE ON SCREEN.
- Use clear, dyslexic-friendly formatting: short bullet points, spacing, and bold keywords.
- Break difficult words into syllables (e.g. pho · to · syn · the · sis).
- For hint/clue requests: give a thoughtful guiding clue without spoiling the exact answer.
- Always be encouraging, warm, and helpful.
- Keep responses concise (1-3 short paragraphs or bullet points).
"""


def _format_single_exercise(ex: dict[str, Any]) -> str:
    """Format an exercise into a readable text block."""
    ex_type = ex.get("type", "unknown")
    title = ex.get("title", "Untitled")
    content = ex.get("content", {})

    lines = [f"Title: {title} (Type: {ex_type.upper()})"]
    if ex_type == "mcq":
        lines.append(f"Question: {content.get('question', '')}")
        options = content.get("options", [])
        for j, opt in enumerate(options):
            lines.append(f"  Option {j}: {opt}")
        correct_idx = content.get("correct_answer_index", "?")
        lines.append(f"Correct Option Index: {correct_idx}")
        lines.append(f"Explanation: {content.get('explanation', '')}")
    elif ex_type == "audio":
        lines.append(f"Target Reading Text: {content.get('target_text', '')}")
        lines.append(f"Pronunciation Guide: {content.get('pronunciation_guide', '')}")
        lines.append(f"Audio Description: {content.get('audio_description', '')}")
    elif ex_type == "emotional":
        lines.append(f"Scenario: {content.get('scenario_description', '')}")
        lines.append(f"Emotion Context: {content.get('emotion_context', '')}")
    elif ex_type == "situational":
        lines.append(f"Situation: {content.get('situation', '')}")
        lines.append(f"Context: {content.get('context', '')}")
        lines.append(f"Expected Skills: {content.get('expected_skills', '')}")
        if content.get("difficulty_hint"):
            lines.append(f"Difficulty Hint: {content.get('difficulty_hint', '')}")
    else:
        lines.append(f"Content: {json.dumps(content, default=str)}")

    return "\n".join(lines)


def _format_exercises_context(exercises: list[dict[str, Any]]) -> str:
    """Format exercise documents into a readable context block."""
    if not exercises:
        return "(No exercises available for this lesson yet.)"

    parts: list[str] = []
    for i, ex in enumerate(exercises, 1):
        parts.append(f"--- Exercise #{i} ---\n" + _format_single_exercise(ex))

    return "\n\n".join(parts)


def _generate_exercise_aware_response(
    question: str,
    lesson_title: str,
    lesson_description: str,
    active_exercise: Optional[dict[str, Any]],
    exercises: list[dict[str, Any]]
) -> str:
    """Generate a rich, context-aware, dyslexic-friendly response grounded in the active webpage exercise."""
    q_lower = question.lower().strip()
    target_ex = active_exercise or (exercises[0] if exercises else None)

    # If student explicitly asked about keywords from another exercise in this lesson
    if not active_exercise and exercises:
        words = [w for w in re.findall(r"\w+", q_lower) if len(w) > 2]
        best_score = 0
        for ex in exercises:
            content = ex.get("content", {})
            text = f"{ex.get('title', '')} {content.get('question', '')} {content.get('target_text', '')}".lower()
            score = sum(1 for w in words if w in text)
            if score > best_score:
                best_score = score
                target_ex = ex

    ex_type = (target_ex.get("type") or "").lower() if target_ex else ""
    ex_title = target_ex.get("title") or "Exercise" if target_ex else "Lesson"
    content = target_ex.get("content") or {} if target_ex else {}

    # Check student intent
    is_clue_request = any(k in q_lower for k in ["clue", "hint", "help me", "point me", "how to solve", "give me a hint"])
    is_simple_request = any(k in q_lower for k in ["simpler", "simple words", "explain", "what does this mean", "don't understand", "dont understand", "what is"])
    is_sound_request = any(k in q_lower for k in ["pronounce", "sound", "break down", "syllable", "say", "read"])
    is_why_request = any(k in q_lower for k in ["why", "important", "matter", "real life", "purpose"])

    # INTENT: Clue / Hint
    if is_clue_request and target_ex:
        if ex_type == "mcq":
            q = content.get("question", "")
            explanation = content.get("explanation", "")
            opts = content.get("options", [])
            return (
                f"💡 **Helpful Clue for '{ex_title}'**:\n\n"
                f"Look closely at the question:\n> *\"{q}\"*\n\n"
                f"👉 **Guiding Clue**: {explanation or 'Think about the main concept we discussed in this lesson.'}\n\n"
                f"🔍 Read through the options and eliminate the ones that don't match the clue!"
            )
        elif ex_type == "audio":
            target = content.get("target_text", "")
            guide = content.get("pronunciation_guide", "")
            return (
                f"💡 **Reading Clue for '{ex_title}'**:\n\n"
                f"Target sentence to read:\n> **\"{target}\"**\n\n"
                f"👉 **Pronunciation guide**: {guide}\n"
                f"👉 **Tip**: Tap your finger on your desk for each syllable sound before you start recording!"
            )
        elif ex_type in ("situational", "emotional"):
            situation = content.get("situation") or content.get("scenario_description") or ""
            skills = content.get("expected_skills") or "communication and calmness"
            hint = content.get("difficulty_hint") or ""
            return (
                f"💡 **Strategy Clue for '{ex_title}'**:\n\n"
                f"**The Situation**: *\"{situation}\"*\n\n"
                f"👉 **Focus on**: {skills}\n"
                f"{f'👉 **Helpful Hint**: {hint}' if hint else '👉 **Tip**: Think about what polite, step-by-step action you would take first!'}"
            )

    # INTENT: Simpler explanation
    if is_simple_request and target_ex:
        if ex_type == "mcq":
            q = content.get("question", "")
            explanation = content.get("explanation", "")
            return (
                f"📘 **Let's Break Down '{ex_title}' in Simple Words**:\n\n"
                f"**Question**: *\"{q}\"*\n\n"
                f"**Here is the key idea**:\n"
                f"- {explanation or 'Focus on the main keyword in the question.'}\n"
                f"- Take it one word at a time, and look at how the question connects to what you learned in the lesson.\n\n"
                f"Which part of the question can I explain further?"
            )
        elif ex_type == "audio":
            target = content.get("target_text", "")
            guide = content.get("pronunciation_guide", "")
            desc = content.get("audio_description", "")
            return (
                f"📖 **Simple Explanation for '{ex_title}'**:\n\n"
                f"Target sentence: **\"{target}\"**\n\n"
                f"- **What it means**: {desc or 'This exercise helps train your oral reading and speech fluency.'}\n"
                f"- **How to say it**: {guide}\n\n"
                f"Take a deep breath and speak clearly at your own pace!"
            )
        elif ex_type in ("situational", "emotional"):
            situation = content.get("situation") or content.get("scenario_description") or ""
            return (
                f"🤝 **Let's Understand '{ex_title}'**:\n\n"
                f"**What is happening**: *\"{situation}\"*\n\n"
                f"**How to approach it**:\n"
                f"1. **Pause & take a breath** — don't feel rushed.\n"
                f"2. **Identify the problem** — what needs to be solved or communicated?\n"
                f"3. **Take a positive action** — express your thoughts clearly and ask for what you need.\n\n"
                f"What would be your first step?"
            )

    # INTENT: Pronunciation / Sound Breakdown
    if is_sound_request:
        if target_ex and ex_type == "audio":
            target = content.get("target_text", "")
            guide = content.get("pronunciation_guide", "")
            return (
                f"🗣️ **Sound Breakdown for '{target}'**:\n\n"
                f"Phonetic Guide: **{guide}**\n\n"
                f"**Rhythm Exercise**:\n"
                f"1. Break the target words into rhythmic syllables.\n"
                f"2. Tap your desk on each beat.\n"
                f"3. Blend the sounds together smoothly!\n\n"
                f"Try reading the whole sentence aloud: **\"{target}\"**."
            )
        else:
            return (
                f"🗣️ **Pronunciation Strategy for {lesson_title}**:\n\n"
                f"1. Cover the second half of the difficult word with your finger.\n"
                f"2. Sound out the first syllable.\n"
                f"3. Uncover the next part and blend them together!\n\n"
                f"Is there a specific word on your screen you'd like me to break down?"
            )

    # INTENT: Why is this concept important?
    if is_why_request:
        return (
            f"🌍 **Why '{lesson_title}' is Important**:\n\n"
            f"**Lesson Goal**: {lesson_description}\n\n"
            f"Mastering this concept builds your confidence, reading speed, and problem-solving skills step by step!\n\n"
            f"Every exercise you complete strengthens your learning brain. 🌟"
        )

    # Default Contextual Assistance for the Active Exercise
    if target_ex:
        if ex_type == "mcq":
            q = content.get("question", "")
            explanation = content.get("explanation", "")
            return (
                f"I'm here to help with **{ex_title}**!\n\n"
                f"**Question**: *\"{q}\"*\n\n"
                f"**Key Concept**: {explanation}\n\n"
                f"You can ask me for a **clue**, a **simpler explanation**, or why a specific option works best!"
            )
        elif ex_type == "audio":
            target = content.get("target_text", "")
            guide = content.get("pronunciation_guide", "")
            return (
                f"I'm here to help with your speech & reading exercise: **{ex_title}**!\n\n"
                f"**Target Sentence**: \"{target}\"\n"
                f"**Pronunciation**: {guide}\n\n"
                f"Would you like me to break down any sound or give you a reading tip?"
            )
        elif ex_type in ("situational", "emotional"):
            situation = content.get("situation") or content.get("scenario_description") or ""
            return (
                f"I'm here to help with the challenge: **{ex_title}**!\n\n"
                f"**Scenario**: *\"{situation}\"*\n\n"
                f"Think about the best way to handle this situation. I can give you a clue or help brainstorm ideas!"
            )

    # General lesson greeting fallback
    return (
        f"Hello! I am your AI learning tutor for **{lesson_title}**.\n\n"
        f"**Lesson Goal**: {lesson_description}\n\n"
        f"You can ask me anything about the exercises on your screen, ask for a clue, or ask me to explain any word in simpler terms!"
    )


class ChatService:
    """Per-lesson chatbot with full live exercise context awareness."""

    def __init__(self, db: Any):
        self.db = db

    async def chat(self, lesson_id: str, request: ChatRequest) -> ChatResponse:
        """Answer a student's question in the context of a specific lesson and active exercise."""

        # 1. Load lesson
        lesson_obj_id = ObjectId(lesson_id) if ObjectId.is_valid(lesson_id) else lesson_id
        lesson = await self.db["lessons"].find_one({"_id": lesson_obj_id})
        if not lesson:
            lesson = await self.db["lessons"].find_one({"_id": lesson_id})
        if not lesson:
            from app.exceptions.handlers import EntityNotFoundException
            raise EntityNotFoundException(f"Lesson with id {lesson_id} not found")

        lesson_title = lesson.get("title", "Untitled Lesson")
        lesson_description = lesson.get("description", "")

        # 2. Load all exercises for this lesson
        cursor = self.db["exercises"].find({"lesson_id": lesson_obj_id})
        exercises = await cursor.to_list(length=50)
        if not exercises:
            cursor = self.db["exercises"].find({"lesson_id": lesson_id})
            exercises = await cursor.to_list(length=50)

        # 3. Identify the active exercise currently visible on student screen
        active_exercise = None
        if request.current_exercise_context:
            active_exercise = request.current_exercise_context
        elif request.exercise_id:
            for ex in exercises:
                if str(ex.get("_id")) == str(request.exercise_id):
                    active_exercise = ex
                    break

        if not active_exercise and exercises:
            active_exercise = exercises[0]

        active_exercise_details = _format_single_exercise(active_exercise) if active_exercise else "(No active exercise)"
        exercises_context = _format_exercises_context(exercises)

        # 4. Build system prompt
        system_prompt = CHATBOT_SYSTEM_TEMPLATE.format(
            lesson_title=lesson_title,
            lesson_description=lesson_description,
            active_exercise_details=active_exercise_details,
            exercises_context=exercises_context,
        )

        # 5. Build message list
        messages = [SystemMessage(content=system_prompt)]
        for msg in request.conversation_history[-6:]:
            if msg.role == "user":
                messages.append(HumanMessage(content=msg.content))
            else:
                messages.append(AIMessage(content=msg.content))

        messages.append(HumanMessage(content=request.message))

        # 6. Call LLM or intelligent real-time contextual responder
        reply = None
        if settings.GROQ_API_KEY and not settings.GROQ_API_KEY.startswith("gsk_test") and "placeholder" not in settings.GROQ_API_KEY.lower():
            try:
                chat_llm = ChatGroq(
                    model=settings.GROQ_MODEL_NAME,
                    api_key=settings.GROQ_API_KEY,
                    temperature=0.4,
                )
                response = await chat_llm.ainvoke(messages)
                reply = response.content
            except Exception as e:
                logger.info(f"Groq LLM chat error, using active exercise responder: {e}")

        if not reply:
            reply = _generate_exercise_aware_response(
                question=request.message,
                lesson_title=lesson_title,
                lesson_description=lesson_description,
                active_exercise=active_exercise,
                exercises=exercises
            )

        return ChatResponse(reply=reply, lesson_id=lesson_id)
