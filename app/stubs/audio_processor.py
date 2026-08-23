"""Audio processor stubs."""
from typing import Any

async def analyze_audio(audio_file_path: str) -> dict[str, Any]:
    """Skeleton: Analyze audio recording for pronunciation accuracy.
    
    In production, this would use speech recognition and phoneme analysis
    to compare the student's pronunciation against the target text.
    
    Returns:
        dict with keys: transcription (str), pronunciation_score (float 0-100),
        issues (list[str]), audio_description (str)
    """
    return {
        "transcription": "[Audio transcription placeholder]",
        "pronunciation_score": 0.0,
        "issues": [],
        "audio_description": "[Audio analysis will be available when audio processing is implemented]"
    }

async def get_audio_description(audio_file_path: str) -> str:
    """Skeleton: Generate a text description of the audio for LLM analysis."""
    return "[Audio description placeholder - implement audio processing to generate real descriptions]"
