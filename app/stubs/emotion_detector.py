"""Emotion detector stubs."""
from typing import Any

async def detect_emotional_state(visual_data_path: str) -> dict[str, Any]:
    """Skeleton: Detect emotional distress from visual/behavioral input.
    
    In production, this would analyze facial expressions, body language,
    or behavioral patterns to assess emotional state.
    
    Returns:
        dict with keys: emotion (str), confidence (float 0-1),
        distress_level (str: low/medium/high), emotion_description (str)
    """
    return {
        "emotion": "neutral",
        "confidence": 0.0,
        "distress_level": "low",
        "emotion_description": "[Emotion detection will be available when visual processing is implemented]"
    }

async def get_emotion_description(visual_data_path: str) -> str:
    """Skeleton: Generate text description of emotional state for LLM analysis."""
    return "[Emotion description placeholder - implement emotion detection to generate real descriptions]"
