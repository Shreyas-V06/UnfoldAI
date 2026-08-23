import logging
import re
import difflib
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_groq import ChatGroq

from app.core.config import settings
from app.agents.state import ExerciseAgentState
from app.agents.utils import parse_llm_json
from app.agents.prompts.evaluation import (
    EVALUATION_SYSTEM_PROMPT,
    MCQ_EVALUATION_PROMPT,
    AUDIO_EVALUATION_PROMPT,
    EMOTIONAL_EVALUATION_PROMPT,
    SITUATIONAL_EVALUATION_PROMPT
)

logger = logging.getLogger(__name__)


def _evaluate_situational_semantic(situation: str, context: str, expected_skills: str, student_response: str) -> dict:
    """Intelligent semantic evaluation for situational exercises."""
    resp = (student_response or "").strip()
    if not resp:
        return {
            "score": 0.0,
            "correct": False,
            "analysis": "No response provided. Please explain how you would resolve the situation.",
            "identified_issues": ["Empty response", "Missing solution strategy"]
        }

    words = re.findall(r'\w+', resp.lower())
    if len(words) < 3 or len(resp) < 8:
        return {
            "score": 15.0,
            "correct": False,
            "analysis": f"The response '{resp}' is too brief to address the situation or demonstrate {expected_skills}.",
            "identified_issues": ["Response is too brief", "Missing explanation of steps"]
        }

    STOPWORDS = {
        "the", "and", "a", "an", "in", "on", "at", "to", "for", "of", "with", "by", "from",
        "up", "about", "into", "over", "after", "is", "are", "was", "were", "be", "been",
        "being", "have", "has", "had", "do", "does", "did", "but", "if", "or", "because",
        "as", "until", "while", "that", "this", "these", "those", "then", "so", "than",
        "too", "very", "can", "will", "just", "don", "should", "now", "it", "its", "you",
        "your", "they", "them", "their", "we", "us", "our", "he", "him", "his", "she",
        "her", "hers", "what", "which", "who", "whom", "when", "where", "why", "how",
        "all", "any", "both", "each", "few", "more", "most", "other", "some", "such",
        "no", "nor", "not", "only", "own", "same", "than", "too", "very", "one", "two",
        "week", "placed", "turned", "started", "inside", "like", "make", "made", "would", "could", "also"
    }

    target_corpus = f"{situation} {context} {expected_skills}".lower()
    target_words = set(re.findall(r'\w{3,}', target_corpus)) - STOPWORDS

    action_keywords = {
        "ask", "tell", "speak", "talk", "teacher", "help", "partner", "listen",
        "write", "note", "read", "repeat", "explain", "understand", "slow", "quiet", "calm",
        "deep", "breath", "pause", "try", "plan", "solve", "step", "fix", "apologize", "share",
        "card", "ruler", "break", "time", "focus", "together", "hand", "raise", "polite",
        "respect", "feel", "think", "suggest", "choice", "option", "agree", "support", "practice",
        "sorry", "honest", "guide", "assist", "check", "stop", "wait", "patient", "move", "window",
        "sunlight", "light", "water", "plant", "grow", "chlorophyll", "leaves", "air"
    }

    resp_words = set(words) - STOPWORDS
    meaningful_target_overlap = resp_words.intersection(target_words)
    action_overlap = resp_words.intersection(action_keywords)

    # Check for nonsense/gibberish
    nonsense_count = sum(1 for w in words if len(w) > 6 and not any(v in w for v in 'aeiouy'))
    if nonsense_count >= 2 or (len(words) >= 4 and len(resp_words) <= 2):
        return {
            "score": 5.0,
            "correct": False,
            "analysis": "The response appears to contain random or repetitive characters rather than a structured answer.",
            "identified_issues": ["Unintelligible input", "Missing problem-solving strategy"]
        }

    # Strict off-topic detection: If zero target keywords match the situation/skills
    if len(meaningful_target_overlap) == 0:
        return {
            "score": 15.0,
            "correct": False,
            "analysis": f"The submitted answer ('{resp[:70]}...') is off-topic. It does not address the situation or demonstrate {expected_skills}.",
            "identified_issues": ["Unrelated response to scenario", f"Missing focus on: {expected_skills}"]
        }

    total_matches = len(meaningful_target_overlap) + len(action_overlap)

    if total_matches == 1 and len(words) < 6:
        return {
            "score": 45.0,
            "correct": False,
            "analysis": f"A good initial idea, but the response needs more detail on how you would apply {expected_skills}.",
            "identified_issues": ["Needs more detail on specific action steps"]
        }
    elif total_matches >= 2 and len(words) >= 5:
        depth_score = min(30.0, len(words) * 2.0)
        relevance_score = min(40.0, total_matches * 10.0)
        skill_score = 25.0
        final_score = min(98.0, 15.0 + depth_score + relevance_score + skill_score)
        return {
            "score": round(final_score, 1),
            "correct": True,
            "analysis": f"Great solution! Your response thoughtfully addresses the situation and demonstrates {expected_skills} with constructive reasoning.",
            "identified_issues": []
        }
    else:
        return {
            "score": 55.0,
            "correct": True,
            "analysis": f"Relevant response addressing the core dilemma. Consider adding one more specific follow-up step to fully resolve the situation.",
            "identified_issues": ["Could expand on the follow-up strategy"]
        }


def _evaluate_audio_semantic(target_text: str, pronunciation_guide: str, submission: dict) -> dict:
    """Intelligent semantic evaluation for audio & voice reading exercises."""
    audio_analysis = submission.get("audio_analysis", {})
    linguistic = audio_analysis.get("linguistic", {})
    vad_stats = audio_analysis.get("vad", {})
    metrics = audio_analysis.get("audio_analysis", {})

    transcript = linguistic.get("transcript") or submission.get("student_response") or submission.get("text") or ""
    transcript = str(transcript).strip()

    target_clean = re.sub(r'[^\w\s]', '', target_text.lower()).strip()
    trans_clean = re.sub(r'[^\w\s]', '', transcript.lower()).strip()

    if not trans_clean or metrics.get("audio_state") == "no_speech":
        return {
            "score": 15.0,
            "correct": False,
            "analysis": f"No clear speech was detected for '{target_text}'. Please check your microphone and try reading aloud clearly.",
            "identified_issues": ["No clear voice signal detected", f"Target sentence was: '{target_text}'"]
        }

    sim = difflib.SequenceMatcher(None, target_clean, trans_clean).ratio()
    target_words = target_clean.split()
    trans_words = trans_clean.split()

    matched_words = [w for w in trans_words if w in target_words]
    missed_words = [w for w in target_words if w not in trans_words]
    word_acc = len(matched_words) / max(len(target_words), 1)

    wpm = linguistic.get("words_per_minute", 90.0)
    pauses = vad_stats.get("long_pause_count", 0)

    fluency_factor = 1.0
    if wpm < 30 and len(target_words) > 3:
        fluency_factor -= 0.15
    if pauses >= 3:
        fluency_factor -= 0.10

    raw_score = ((sim * 0.6) + (word_acc * 0.4)) * 100.0 * fluency_factor
    score = max(10.0, min(100.0, round(raw_score, 1)))

    video_analysis = submission.get("video_analysis", {})
    visual_state = video_analysis.get("visual_state", "") if video_analysis else ""
    expression = video_analysis.get("expression", {}).get("dominant", "focused") if video_analysis else "focused"
    visual_score = video_analysis.get("visual_signal_score", 0.15) if video_analysis else 0.15

    visual_remark = ""
    if video_analysis:
        if visual_score < 0.35:
            visual_remark = " Your visual engagement and eye focus on the text remained steady throughout."
        elif "increased_gaze_variability" in video_analysis.get("signal_reasons", []):
            visual_remark = " Noted slight gaze shifts during reading; maintaining focus on line spacing helps smooth oral fluency."
        else:
            visual_remark = f" Observable engagement was {expression}."

    if score >= 80.0:
        return {
            "score": score,
            "correct": True,
            "analysis": f"Excellent pronunciation! You read '{target_text}' with clear articulation ({round(wpm)} WPM).{visual_remark}",
            "identified_issues": []
        }
    elif score >= 50.0:
        return {
            "score": score,
            "correct": True,
            "analysis": f"Good reading effort! You correctly pronounced {len(matched_words)} of {len(target_words)} words. Practice blending the remaining syllables.{visual_remark}",
            "identified_issues": [f"Review pronunciation for: {', '.join(missed_words[:3])}"] if missed_words else []
        }
    else:
        return {
            "score": score,
            "correct": False,
            "analysis": f"The spoken audio ('{transcript[:60]}...') differed from the target text '{target_text}'.{visual_remark}",
            "identified_issues": [f"Words needing practice: {', '.join(target_words[:3])}", "Practice with syllable chunking cards"]
        }



def _evaluate_emotional_semantic(scenario_description: str, emotion_context: str, submission: dict) -> dict:
    """Intelligent semantic evaluation for emotional awareness exercises."""
    resp = submission.get("student_response") or submission.get("response") or submission.get("text") or ""
    selected_emotion = submission.get("selected_emotion", "")
    resp_str = str(resp).strip()

    if not resp_str and not selected_emotion:
        return {
            "score": 0.0,
            "correct": False,
            "analysis": "Please select how you would feel and describe how you would handle the situation.",
            "identified_issues": ["No emotion or reflection provided"]
        }

    words = re.findall(r'\w+', resp_str.lower())
    if len(words) < 2 and not selected_emotion:
        return {
            "score": 20.0,
            "correct": False,
            "analysis": "The reflection is too brief. Try sharing how this situation makes you feel and what helps you feel better.",
            "identified_issues": ["Reflection needs more emotional self-awareness detail"]
        }

    score = 55.0
    if selected_emotion:
        score += 25.0
    if len(words) >= 5:
        score += min(18.0, len(words) * 1.5)

    score = min(98.0, score)
    return {
        "score": round(score, 1),
        "correct": True,
        "analysis": f"Wonderful emotional awareness! Acknowledging feelings ({selected_emotion or 'your feelings'}) and reflecting constructively builds resilience and self-advocacy.",
        "identified_issues": []
    }


async def evaluate_submission(state: ExerciseAgentState) -> dict:
    exercise_type = state["exercise_type"]
    content = state["exercise_content"]
    submission = state["submission"]
    
    prompt_template = ""
    formatted_prompt = ""
    ans_idx = -1
    
    if exercise_type == "mcq":
        ans_idx = submission.get("student_answer_index", submission.get("selected_option_index", submission.get("answer_index", -1)))
        prompt_template = MCQ_EVALUATION_PROMPT
        formatted_prompt = prompt_template.format(
            question=content.get("question", ""),
            options=content.get("options", []),
            correct_answer_index=content.get("correct_answer_index", -1),
            student_answer_index=ans_idx,
            explanation=content.get("explanation", "")
        )
    elif exercise_type == "audio":
        prompt_template = AUDIO_EVALUATION_PROMPT
        audio_analysis = submission.get("audio_analysis", {})
        if audio_analysis:
            linguistic = audio_analysis.get("linguistic", {})
            vad_stats = audio_analysis.get("vad", {})
            metrics = audio_analysis.get("audio_analysis", {})
            transcript = linguistic.get("transcript", "")
            
            desc = (
                f"Transcript: {transcript}\n"
                f"WPM: {linguistic.get('words_per_minute', 0):.1f}\n"
                f"Long Pauses: {vad_stats.get('long_pause_count', 0)}\n"
                f"Self Corrections: {linguistic.get('self_correction_pattern_count', 0)}\n"
                f"Audio State: {metrics.get('audio_state', 'unknown')}\n"
                f"Signal Score: {metrics.get('audio_signal_score', 0)}"
            )
        else:
            desc = submission.get("audio_description", submission.get("student_response", ""))
            
        formatted_prompt = prompt_template.format(
            target_text=content.get("target_text", ""),
            audio_description=desc,
            pronunciation_guide=content.get("pronunciation_guide", "")
        )
    elif exercise_type == "emotional":
        prompt_template = EMOTIONAL_EVALUATION_PROMPT
        formatted_prompt = prompt_template.format(
            scenario_description=content.get("scenario_description", ""),
            emotion_context=content.get("emotion_context", ""),
            student_response=submission.get("student_response", submission.get("response", submission.get("text", "")))
        )
    elif exercise_type == "situational":
        prompt_template = SITUATIONAL_EVALUATION_PROMPT
        formatted_prompt = prompt_template.format(
            situation=content.get("situation", ""),
            context=content.get("context", ""),
            expected_skills=content.get("expected_skills", ""),
            student_response=submission.get("student_response", submission.get("response", submission.get("text", "")))
        )
    else:
        formatted_prompt = f"Exercise type: {exercise_type}\nContent: {content}\nSubmission: {submission}\nPlease evaluate."
        
    evaluation_dict = None
    if settings.GROQ_API_KEY and not settings.GROQ_API_KEY.startswith("gsk_test"):
        try:
            chat = ChatGroq(model=settings.GROQ_MODEL_NAME, api_key=settings.GROQ_API_KEY, temperature=0.3)
            messages = [
                SystemMessage(content=EVALUATION_SYSTEM_PROMPT),
                HumanMessage(content=formatted_prompt)
            ]
            response = await chat.ainvoke(messages)
            evaluation_dict = parse_llm_json(response.content)
        except Exception as e:
            logger.warning(f"Groq LLM evaluation error, using semantic evaluator: {e}")

    # If LLM didn't return or failed, execute our deep semantic evaluation engine
    if not evaluation_dict or "score" not in evaluation_dict:
        if exercise_type == "mcq":
            correct = (ans_idx == content.get("correct_answer_index"))
            score = 100.0 if correct else 0.0
            analysis = "Correct answer selected!" if correct else f"Student selected option {ans_idx}. {content.get('explanation', '')}"
            issues = [] if correct else ["Option selection mismatch"]
            evaluation_dict = {
                "score": score,
                "correct": correct,
                "analysis": analysis,
                "identified_issues": issues
            }
        elif exercise_type == "situational":
            evaluation_dict = _evaluate_situational_semantic(
                situation=content.get("situation", ""),
                context=content.get("context", ""),
                expected_skills=content.get("expected_skills", ""),
                student_response=submission.get("student_response", submission.get("response", submission.get("text", "")))
            )
        elif exercise_type == "audio":
            evaluation_dict = _evaluate_audio_semantic(
                target_text=content.get("target_text", ""),
                pronunciation_guide=content.get("pronunciation_guide", ""),
                submission=submission
            )
        elif exercise_type == "emotional":
            evaluation_dict = _evaluate_emotional_semantic(
                scenario_description=content.get("scenario_description", ""),
                emotion_context=content.get("emotion_context", ""),
                submission=submission
            )
        else:
            evaluation_dict = {
                "score": 75.0,
                "correct": True,
                "analysis": "Exercise response recorded.",
                "identified_issues": []
            }
        
    return {"evaluation": evaluation_dict}
