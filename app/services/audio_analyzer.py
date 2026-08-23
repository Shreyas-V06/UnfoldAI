"""
PRO SPEAKER-CENTRIC AUDIO BEHAVIOR ANALYZER
(Adapted for Unfold integration)
"""

from __future__ import annotations

import json
import math
import os
import re
import shutil
import subprocess
import sys
import warnings
from pathlib import Path
from collections import Counter

import numpy as np
import pandas as pd
import soundfile as sf
import scipy.signal as signal

warnings.filterwarnings("ignore")

try:
    import torch
except Exception:
    torch = None

try:
    import librosa
except Exception:
    librosa = None

try:
    import noisereduce as nr
except Exception:
    nr = None

try:
    from faster_whisper import WhisperModel
except Exception:
    WhisperModel = None

try:
    from silero_vad import load_silero_vad, get_speech_timestamps
except Exception:
    load_silero_vad = None
    get_speech_timestamps = None


# ---------------------------------------------------------------------------
# PATHS / CONSTANTS
# ---------------------------------------------------------------------------

ROOT = Path(__file__).resolve().parent
MODELS_DIR = ROOT / "models"
OUTPUT_DIR = ROOT.parent.parent / "audio_analysis"
OUTPUT_DIR.mkdir(exist_ok=True)

SAMPLE_RATE = 16000
FORCED_ASR_LANGUAGE = "en"  # Permanent English transcription.
CHANNELS = 1

# Speech analysis defaults
FRAME_MS = 30
FRAME_SAMPLES = int(SAMPLE_RATE * FRAME_MS / 1000)

MIN_SPEECH_SEC = 0.20
MIN_SEGMENT_GAP_SEC = 0.18
MAX_MERGE_GAP_SEC = 0.35

# Acoustic limits
SPEECH_LOW_HZ = 70.0
SPEECH_HIGH_HZ = 7600.0

DEFAULT_WHISPER_MODEL = "small"


# ---------------------------------------------------------------------------
# GENERAL UTILITIES
# ---------------------------------------------------------------------------

def safe_float(x, default=0.0):
    try:
        x = float(x)
        if not math.isfinite(x):
            return default
        return x
    except Exception:
        return default


def clamp(x, lo=0.0, hi=1.0):
    return max(lo, min(hi, safe_float(x)))


def rms_db(x):
    x = np.asarray(x, dtype=np.float32)
    if len(x) == 0:
        return -80.0
    rms = np.sqrt(np.mean(np.square(x)) + 1e-12)
    return float(20.0 * np.log10(rms + 1e-12))


def zcr(x):
    x = np.asarray(x, dtype=np.float32)
    if len(x) < 2:
        return 0.0
    signs = np.signbit(x)
    return float(np.mean(signs[1:] != signs[:-1]))


def robust_mean(values, default=0.0):
    values = [safe_float(v, np.nan) for v in values]
    values = [v for v in values if math.isfinite(v)]
    return float(np.mean(values)) if values else default


def robust_std(values, default=0.0):
    values = [safe_float(v, np.nan) for v in values]
    values = [v for v in values if math.isfinite(v)]
    return float(np.std(values)) if values else default


def linear_slope(values):
    values = np.asarray(values, dtype=np.float64)
    if len(values) < 2:
        return 0.0
    x = np.arange(len(values), dtype=np.float64)
    try:
        return float(np.polyfit(x, values, 1)[0])
    except Exception:
        return 0.0


def require_package(condition, name, install_hint):
    if not condition:
        raise RuntimeError(f"Missing package: {name}. Install with: {install_hint}")


def find_ffmpeg():
    exe = shutil.which("ffmpeg")
    if exe:
        return exe

    candidates = [
        Path(r"C:\ffmpeg\bin\ffmpeg.exe"),
        Path(r"C:\Program Files\ffmpeg\bin\ffmpeg.exe"),
    ]

    # Dynamically search winget package directory on Windows
    if sys.platform == "win32":
        localappdata = os.environ.get("LOCALAPPDATA")
        if localappdata:
            winget_dir = Path(localappdata) / "Microsoft" / "WinGet" / "Packages"
            if winget_dir.exists():
                for p in winget_dir.glob("**/ffmpeg.exe"):
                    return str(p)

    for candidate in candidates:
        if candidate.exists():
            return str(candidate)

    return None


# ---------------------------------------------------------------------------
# AUDIO EXTRACTION
# ---------------------------------------------------------------------------

def extract_audio(input_path: Path, output_wav: Path):
    ffmpeg = find_ffmpeg()
    if ffmpeg is None:
        raise RuntimeError("FFmpeg was not found. Install FFmpeg.")

    cmd = [
        ffmpeg,
        "-y",
        "-i", str(input_path),
        "-vn",
        "-ac", "1",
        "-ar", str(SAMPLE_RATE),
        "-sample_fmt", "s16",
        str(output_wav),
    ]

    result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)

    if result.returncode != 0:
        raise RuntimeError("FFmpeg failed:\n" + result.stderr[-3000:])

    if not output_wav.exists():
        raise RuntimeError("Audio extraction completed but output WAV was not created.")


# ---------------------------------------------------------------------------
# AUDIO LOADING / PREPROCESSING
# ---------------------------------------------------------------------------

def load_audio(path: Path):
    audio, sr = sf.read(str(path), dtype="float32")

    if audio.ndim > 1:
        audio = np.mean(audio, axis=1)

    if sr != SAMPLE_RATE:
        require_package(librosa is not None, "librosa", "python -m pip install librosa")
        audio = librosa.resample(audio, orig_sr=sr, target_sr=SAMPLE_RATE)
        sr = SAMPLE_RATE

    audio = np.asarray(audio, dtype=np.float32)

    peak = np.max(np.abs(audio)) if len(audio) else 0.0
    if peak > 1.0:
        audio = audio / peak

    return audio, sr


def butter_bandpass(audio, low_hz=SPEECH_LOW_HZ, high_hz=SPEECH_HIGH_HZ):
    if len(audio) < SAMPLE_RATE // 10:
        return audio

    nyquist = SAMPLE_RATE / 2.0
    low = max(10.0, low_hz) / nyquist
    high = min(high_hz, nyquist - 100.0) / nyquist

    if low >= high:
        return audio

    b, a = signal.butter(4, [low, high], btype="band")
    try:
        return signal.sosfiltfilt(signal.tf2sos(b, a), audio).astype(np.float32)
    except Exception:
        return audio


def normalize_audio(audio, target_db=-20.0):
    if len(audio) == 0:
        return audio

    current = rms_db(audio)
    gain_db = target_db - current
    gain_db = max(-6.0, min(24.0, gain_db))
    gain = 10.0 ** (gain_db / 20.0)
    y = audio * gain

    peak = np.max(np.abs(y))
    if peak > 0.98:
        y = y * (0.98 / peak)

    return y.astype(np.float32)


def gentle_compress(audio, threshold_db=-18.0, ratio=2.5):
    x = np.asarray(audio, dtype=np.float32)
    if len(x) == 0:
        return x

    threshold = 10.0 ** (threshold_db / 20.0)
    y = x.copy()

    mag = np.abs(y)
    over = mag > threshold

    if np.any(over):
        compressed = threshold + (mag[over] - threshold) / ratio
        y[over] = np.sign(y[over]) * compressed

    peak = np.max(np.abs(y))
    if peak > 0.98:
        y *= 0.98 / peak

    return y.astype(np.float32)


def denoise_audio(audio):
    if nr is None:
        return audio
    if len(audio) < SAMPLE_RATE:
        return audio

    frame_len = int(0.5 * SAMPLE_RATE)
    hop = int(0.25 * SAMPLE_RATE)

    energies = []
    starts = []

    for start in range(0, max(1, len(audio) - frame_len + 1), hop):
        chunk = audio[start:start + frame_len]
        if len(chunk) < frame_len:
            continue
        energies.append(rms_db(chunk))
        starts.append(start)

    if not energies:
        return audio

    order = np.argsort(energies)
    selected = []
    for idx in order[:max(1, min(6, len(order)))]:
        selected.append(audio[starts[idx]:starts[idx] + frame_len])

    noise_clip = np.concatenate(selected) if selected else audio[:frame_len]

    try:
        cleaned = nr.reduce_noise(
            y=audio, sr=SAMPLE_RATE, y_noise=noise_clip,
            stationary=False, prop_decrease=0.75, n_fft=1024, hop_length=256,
        )
        return np.asarray(cleaned, dtype=np.float32)
    except Exception:
        return audio


def preprocess_audio(audio):
    original = audio.copy()
    audio = audio - np.mean(audio)
    audio = butter_bandpass(audio)
    audio = denoise_audio(audio)
    audio = gentle_compress(audio)
    audio = normalize_audio(audio)
    return original, audio


# ---------------------------------------------------------------------------
# SILERO VAD
# ---------------------------------------------------------------------------

def load_vad_model():
    require_package(torch is not None, "torch", "pip install torch torchaudio")
    require_package(load_silero_vad is not None, "silero-vad", "pip install silero-vad")

    try:
        model = load_silero_vad()
        return model
    except Exception as exc:
        raise RuntimeError(f"Could not load Silero VAD: {exc}")


def merge_segments(segments, gap=MAX_MERGE_GAP_SEC):
    if not segments:
        return []

    segments = sorted(segments, key=lambda x: x["start"])
    merged = [dict(segments[0])]

    for seg in segments[1:]:
        previous = merged[-1]
        if seg["start"] - previous["end"] <= gap:
            previous["end"] = max(previous["end"], seg["end"])
            previous["duration"] = previous["end"] - previous["start"]
            previous["confidence"] = max(previous.get("confidence", 0.0), seg.get("confidence", 0.0))
        else:
            merged.append(dict(seg))

    return merged


def run_vad(audio, vad_model):
    tensor = torch.from_numpy(audio)
    try:
        raw = get_speech_timestamps(
            tensor, vad_model, sampling_rate=SAMPLE_RATE, threshold=0.50,
            min_speech_duration_ms=180, min_silence_duration_ms=180, speech_pad_ms=80, return_seconds=True,
        )
    except TypeError:
        raw = get_speech_timestamps(
            tensor, vad_model, sampling_rate=SAMPLE_RATE, threshold=0.50,
            min_speech_duration_ms=180, min_silence_duration_ms=180, speech_pad_ms=80,
        )
        converted = [{"start": item["start"] / SAMPLE_RATE, "end": item["end"] / SAMPLE_RATE} for item in raw]
        raw = converted

    segments = []
    for item in raw:
        start = safe_float(item.get("start"))
        end = safe_float(item.get("end"))
        duration = end - start
        if duration < MIN_SPEECH_SEC:
            continue
        confidence = safe_float(item.get("confidence", 0.75), 0.75)
        segments.append({"start": start, "end": end, "duration": duration, "confidence": confidence})

    return merge_segments(segments)


def make_speech_timeline_audio(audio, segments):
    if len(audio) == 0:
        return np.zeros(0, dtype=np.float32)

    output = np.zeros_like(audio, dtype=np.float32)
    for seg in segments:
        start = max(0, int(seg["start"] * SAMPLE_RATE))
        end = min(len(audio), int(seg["end"] * SAMPLE_RATE))
        if end <= start:
            continue

        piece = audio[start:end].astype(np.float32).copy()
        fade_len = min(int(0.005 * SAMPLE_RATE), len(piece) // 2)
        if fade_len > 1:
            piece[:fade_len] *= np.linspace(0.0, 1.0, fade_len)
            piece[-fade_len:] *= np.linspace(1.0, 0.0, fade_len)

        output[start:end] = piece

    return output.astype(np.float32)


def make_speech_only_audio(audio, segments):
    if not segments:
        return np.zeros(0, dtype=np.float32)

    pieces = []
    for seg in segments:
        start = max(0, int(seg["start"] * SAMPLE_RATE))
        end = min(len(audio), int(seg["end"] * SAMPLE_RATE))
        if end > start:
            pieces.append(audio[start:end])

    if not pieces:
        return np.zeros(0, dtype=np.float32)

    processed = []
    for piece in pieces:
        piece = piece.copy()
        fade_len = min(int(0.008 * SAMPLE_RATE), len(piece) // 2)
        if fade_len > 1:
            piece[:fade_len] *= np.linspace(0, 1, fade_len)
            piece[-fade_len:] *= np.linspace(1, 0, fade_len)
        processed.append(piece)

    return np.concatenate(processed).astype(np.float32)


def save_wav(path, audio):
    audio = np.asarray(audio, dtype=np.float32)
    if len(audio) == 0:
        sf.write(str(path), np.zeros(SAMPLE_RATE, dtype=np.float32), SAMPLE_RATE)
    else:
        peak = np.max(np.abs(audio))
        if peak > 0.99:
            audio = audio * (0.98 / peak)
        sf.write(str(path), audio, SAMPLE_RATE, subtype="PCM_16")


# ---------------------------------------------------------------------------
# ACOUSTIC FEATURE EXTRACTION
# ---------------------------------------------------------------------------

def frame_audio(audio, frame_ms=30, hop_ms=15):
    frame = int(SAMPLE_RATE * frame_ms / 1000)
    hop = int(SAMPLE_RATE * hop_ms / 1000)
    if len(audio) < frame:
        return []
    return [audio[start:start + frame] for start in range(0, len(audio) - frame + 1, hop)]


def estimate_pitch_autocorrelation(frame):
    x = frame.astype(np.float64)
    x -= np.mean(x)
    if len(x) < 256: return 0.0
    energy = np.sqrt(np.mean(x * x))
    if energy < 1e-4: return 0.0
    x = x / (energy + 1e-12)
    min_lag = int(SAMPLE_RATE / 350.0)
    max_lag = int(SAMPLE_RATE / 70.0)
    if max_lag >= len(x): max_lag = len(x) - 1
    if min_lag >= max_lag: return 0.0
    corr = np.correlate(x, x, mode="full")
    corr = corr[len(x) - 1:]
    segment = corr[min_lag:max_lag + 1]
    if len(segment) == 0: return 0.0
    lag = min_lag + int(np.argmax(segment))
    strength = corr[lag] / max(corr[0], 1e-9)
    if strength < 0.25: return 0.0
    return float(SAMPLE_RATE / lag)


def spectral_features(frame):
    if len(frame) < 64: return 0.0, 0.0, 0.0
    window = np.hanning(len(frame))
    spectrum = np.abs(np.fft.rfft(frame * window))
    freqs = np.fft.rfftfreq(len(frame), 1.0 / SAMPLE_RATE)
    power = spectrum ** 2
    total = np.sum(power) + 1e-12
    centroid = np.sum(freqs * power) / total
    cumulative = np.cumsum(power)
    roll_idx = np.searchsorted(cumulative, 0.85 * cumulative[-1])
    rolloff = freqs[min(roll_idx, len(freqs) - 1)]
    flatness = np.exp(np.mean(np.log(spectrum + 1e-12))) / (np.mean(spectrum) + 1e-12)
    return float(centroid), float(rolloff), float(flatness)


def extract_acoustic_features(audio):
    frames = frame_audio(audio)
    rows = []
    for i, frame in enumerate(frames):
        start = i * 0.015
        end = start + 0.030
        energy = rms_db(frame)
        pitch = estimate_pitch_autocorrelation(frame)
        centroid, rolloff, flatness = spectral_features(frame)
        rows.append({
            "start": start, "end": end, "rms_db": energy, "pitch_hz": pitch,
            "zcr": zcr(frame), "spectral_centroid_hz": centroid,
            "spectral_rolloff_hz": rolloff, "spectral_flatness": flatness,
        })
    return pd.DataFrame(rows)


# ---------------------------------------------------------------------------
# SPEECH / SILENCE / PAUSE ANALYSIS
# ---------------------------------------------------------------------------

def analyze_segments(segments, total_duration):
    if not segments:
        return {
            "speech_duration_seconds": 0.0, "speech_ratio": 0.0,
            "silence_duration_seconds": total_duration, "pause_count": 0,
            "mean_pause_seconds": 0.0, "long_pause_count": 0,
            "max_pause_seconds": total_duration, "segment_count": 0,
            "mean_segment_duration": 0.0,
        }

    speech_duration = sum(s["duration"] for s in segments)
    pauses = []
    if segments[0]["start"] > 0.15: pauses.append(segments[0]["start"])
    for a, b in zip(segments[:-1], segments[1:]):
        gap = b["start"] - a["end"]
        if gap >= 0.15: pauses.append(gap)
    final_gap = total_duration - segments[-1]["end"]
    if final_gap >= 0.15: pauses.append(final_gap)
    pauses = [float(p) for p in pauses if p >= 0.15]

    return {
        "speech_duration_seconds": float(speech_duration),
        "speech_ratio": float(speech_duration / max(total_duration, 1e-6)),
        "silence_duration_seconds": float(max(0.0, total_duration - speech_duration)),
        "pause_count": len(pauses), "mean_pause_seconds": robust_mean(pauses),
        "long_pause_count": sum(p >= 1.0 for p in pauses),
        "max_pause_seconds": max(pauses) if pauses else 0.0,
        "segment_count": len(segments),
        "mean_segment_duration": robust_mean([s["duration"] for s in segments]),
    }


def compute_speech_timeline(segments, total_duration):
    if total_duration <= 0: return []
    bins = np.linspace(0, total_duration, 5)
    timeline = []
    for i in range(4):
        start, end = bins[i], bins[i + 1]
        overlap = sum(max(0, min(end, s["end"]) - max(start, s["start"])) for s in segments)
        timeline.append({
            "part": i + 1, "label": ["early", "early_middle", "late_middle", "late"][i],
            "start": start, "end": end, "speech_duration": overlap,
            "speech_ratio": overlap / max(end - start, 1e-6),
            "segment_count": sum(1 for s in segments if min(end, s["end"]) > max(start, s["start"])),
        })
    return timeline


# ---------------------------------------------------------------------------
# WHISPER ASR
# ---------------------------------------------------------------------------

def load_whisper(model_name):
    require_package(WhisperModel is not None, "faster-whisper", "pip install faster-whisper")
    return WhisperModel(model_name, device="cpu", compute_type="int8")


def transcribe_audio(model, audio_path, language=None):
    kwargs = {"beam_size": 8, "best_of": 8, "patience": 1.0, "temperature": 0.0,
              "vad_filter": False, "word_timestamps": True, "condition_on_previous_text": False}
    if language: kwargs["language"] = language

    segments, info = model.transcribe(str(audio_path), **kwargs)
    result_segments = []

    for seg in segments:
        text = (seg.text or "").strip()
        if not text: continue
        words = []
        if seg.words:
            for word in seg.words:
                words.append({
                    "word": (word.word or "").strip(), "start": safe_float(word.start),
                    "end": safe_float(word.end), "probability": safe_float(getattr(word, "probability", 0.0)),
                })
        result_segments.append({
            "id": len(result_segments), "start": safe_float(seg.start), "end": safe_float(seg.end),
            "duration": max(0.0, safe_float(seg.end) - safe_float(seg.start)), "text": text,
            "avg_logprob": safe_float(getattr(seg, "avg_logprob", 0.0)),
            "no_speech_prob": safe_float(getattr(seg, "no_speech_prob", 0.0)),
            "words": words,
        })

    return {
        "language": getattr(info, "language", None),
        "language_probability": safe_float(getattr(info, "language_probability", 0.0)),
        "segments": result_segments,
    }


# ---------------------------------------------------------------------------
# LINGUISTIC / READING BEHAVIOR
# ---------------------------------------------------------------------------

FILLER_WORDS = {"um", "uh", "erm", "hmm", "mm", "like", "you know", "actually"}
SELF_CORRECTION_PATTERNS = [r"\bno\b", r"\bi mean\b", r"\bsorry\b", r"\bwait\b", r"\blet me\b", r"\bagain\b", r"\brather\b"]

def tokenize(text): return re.findall(r"\b[\w']+\b", text.lower())

def count_filler_words(text):
    return sum(1 for token in tokenize(text) if token in FILLER_WORDS)

def count_self_corrections(text):
    text = text.lower()
    return sum(len(re.findall(pattern, text)) for pattern in SELF_CORRECTION_PATTERNS)

def analyze_transcript(transcription, total_duration):
    segments = transcription["segments"]
    full_text = " ".join(s["text"] for s in segments).strip()
    tokens = tokenize(full_text)
    speech_duration = sum(max(0.0, s["duration"]) for s in segments) or total_duration
    wpm = (len(tokens) / speech_duration * 60.0) if speech_duration > 0 else 0.0

    segment_gaps = [b["start"] - a["end"] for a, b in zip(segments[:-1], segments[1:]) if (b["start"] - a["end"]) > 0.15]
    avg_word_probability = [word["probability"] for seg in segments for word in seg["words"] if word["probability"] > 0]

    return {
        "transcript": full_text,
        "word_count": len(tokens),
        "speech_duration_seconds": speech_duration,
        "words_per_minute": wpm,
        "filler_word_count": count_filler_words(full_text),
        "self_correction_pattern_count": count_self_corrections(full_text),
        "pause_count_from_transcript": len(segment_gaps),
        "long_pause_count_from_transcript": sum(1 for g in segment_gaps if g >= 0.75),
        "mean_transcript_gap_seconds": robust_mean(segment_gaps),
        "mean_word_confidence": robust_mean(avg_word_probability),
        "language": transcription.get("language"),
        "language_probability": transcription.get("language_probability", 0.0),
        "word_timestamp_count": sum(len(s.get("words", [])) for s in segments),
        "low_confidence_word_count": sum(1 for s in segments for w in s.get("words", []) if 0.0 < safe_float(w.get("probability", 0.0)) < 0.55),
    }


# ---------------------------------------------------------------------------
# TEMPORAL AUDIO ANALYSIS
# ---------------------------------------------------------------------------

def temporal_numeric_summary(df):
    if df.empty:
        return {"early": {}, "early_middle": {}, "late_middle": {}, "late": {}, "changes": {}}

    n = len(df)
    chunk_size = max(1, n // 4)
    parts = []
    for i in range(4):
        start = i * chunk_size
        end = (i + 1) * chunk_size if i < 3 else n
        parts.append(df.iloc[start:end])

    names = ["early", "early_middle", "late_middle", "late"]
    output = {}

    for name, part in zip(names, parts):
        pitches = part["pitch_hz"].to_numpy()
        voiced_pitch = pitches[pitches > 0]
        output[name] = {
            "mean_rms_db": robust_mean(part["rms_db"]),
            "mean_pitch_hz": robust_mean(voiced_pitch),
            "pitch_variability_hz": robust_std(voiced_pitch),
            "mean_zcr": robust_mean(part["zcr"]),
            "mean_spectral_centroid_hz": robust_mean(part["spectral_centroid_hz"]),
        }

    early, late = output["early"], output["late"]
    output["changes"] = {
        "rms_db_change": safe_float(late["mean_rms_db"] - early["mean_rms_db"]),
        "pitch_change_hz": safe_float(late["mean_pitch_hz"] - early["mean_pitch_hz"]),
        "pitch_variability_change": safe_float(late["pitch_variability_hz"] - early["pitch_variability_hz"]),
        "spectral_centroid_change_hz": safe_float(late["mean_spectral_centroid_hz"] - early["mean_spectral_centroid_hz"]),
    }
    return output


def transcript_temporal_analysis(transcription, total_duration):
    segments = transcription["segments"]
    if total_duration <= 0: return []
    bins = np.linspace(0, total_duration, 5)
    result = []
    for i in range(4):
        start, end = bins[i], bins[i + 1]
        selected = [s for s in segments if s["end"] > start and s["start"] < end]
        text = " ".join(s["text"] for s in selected)
        durations = [max(0.0, s["duration"]) for s in selected]
        gaps = [b["start"] - a["end"] for a, b in zip(selected[:-1], selected[1:]) if (b["start"] - a["end"]) > 0.15]
        result.append({
            "part": i + 1, "label": ["early", "early_middle", "late_middle", "late"][i],
            "start": start, "end": end, "segment_count": len(selected),
            "speech_seconds": sum(durations), "pause_count": len(gaps),
            "long_pause_count": sum(g >= 0.75 for g in gaps),
            "mean_gap_seconds": robust_mean(gaps), "word_count": len(tokenize(text)), "text": text,
        })
    return result


def compute_audio_signal_score(pause_stats, linguistic, temporal, vad_quality):
    components = []
    components.append(clamp(pause_stats["long_pause_count"] / 4.0))
    components.append(clamp(linguistic["self_correction_pattern_count"] / 4.0))
    components.append(clamp(linguistic["filler_word_count"] / 6.0))
    changes = temporal.get("changes", {}) if isinstance(temporal, dict) else {}
    components.append(clamp(abs(safe_float(changes.get("pitch_variability_change", 0.0))) / 30.0))

    score = 0.35 * components[0] + 0.25 * components[1] + 0.15 * components[2] + 0.15 * components[3] + 0.10 * clamp(vad_quality)
    return round(clamp(score), 3)


def classify_audio_state(score, pause_stats, linguistic):
    if linguistic["word_count"] < 3: return "insufficient_speech_evidence"
    if score >= 0.70: return "multiple_speech_changes"
    if score >= 0.45: return "possible_speech_difficulty_signal"
    if pause_stats["long_pause_count"] > 0 or linguistic["self_correction_pattern_count"] > 0: return "mild_speech_variability"
    return "relatively_stable_speech_behavior"


def estimate_speaker_centric_quality(speech_ratio, segment_count, transcription):
    score = 0.0
    if speech_ratio >= 0.15: score += 0.25
    if speech_ratio >= 0.35: score += 0.20
    if speech_ratio >= 0.55: score += 0.15
    if segment_count >= 2: score += 0.15
    if transcription["segments"]: score += 0.15
    if transcription.get("language_probability", 0.0) >= 0.70: score += 0.10
    return clamp(score)


def quality_label(score, duration):
    if duration < 10: return "moderate" if score >= 0.65 else "limited"
    if score >= 0.80: return "high"
    if score >= 0.55: return "moderate"
    return "limited"


# ---------------------------------------------------------------------------
# MAIN ANALYSIS INTEGRATION
# ---------------------------------------------------------------------------

def analyze_audio_file(input_path_str: str, language: str = None) -> dict:
    """Entry point for FastAPI / AI Agent."""
    input_path = Path(input_path_str)
    if not input_path.exists():
        raise FileNotFoundError(f"Input file not found: {input_path}")

    raw_wav = OUTPUT_DIR / f"{input_path.stem}_01_original.wav"
    speech_timeline_wav = OUTPUT_DIR / f"{input_path.stem}_04_timeline.wav"

    extract_audio(input_path, raw_wav)
    original_audio, sr = load_audio(raw_wav)
    duration = len(original_audio) / SAMPLE_RATE

    _, enhanced_audio = preprocess_audio(original_audio)

    vad_model = load_vad_model()
    speech_segments = run_vad(enhanced_audio, vad_model)

    speech_only = make_speech_only_audio(enhanced_audio, speech_segments)
    speech_timeline_audio = make_speech_timeline_audio(enhanced_audio, speech_segments)
    save_wav(speech_timeline_wav, speech_timeline_audio)

    vad_stats = analyze_segments(speech_segments, duration)

    acoustic_df = extract_acoustic_features(speech_only)
    if acoustic_df.empty:
        acoustic_summary = {"mean_rms_db": -80.0, "mean_pitch_hz": 0.0, "pitch_variability_hz": 0.0, "mean_zcr": 0.0, "mean_spectral_centroid_hz": 0.0}
        temporal = {"early": {}, "early_middle": {}, "late_middle": {}, "late": {}, "changes": {}}
    else:
        voiced_pitch = acoustic_df[acoustic_df["pitch_hz"] > 0]["pitch_hz"]
        acoustic_summary = {
            "mean_rms_db": robust_mean(acoustic_df["rms_db"]),
            "mean_pitch_hz": robust_mean(voiced_pitch),
            "pitch_variability_hz": robust_std(voiced_pitch),
            "mean_zcr": robust_mean(acoustic_df["zcr"]),
            "mean_spectral_centroid_hz": robust_mean(acoustic_df["spectral_centroid_hz"]),
        }
        temporal = temporal_numeric_summary(acoustic_df)

    whisper = load_whisper(DEFAULT_WHISPER_MODEL)
    transcription = transcribe_audio(whisper, speech_timeline_wav, language=language)
    linguistic = analyze_transcript(transcription, duration)

    speech_timeline = compute_speech_timeline(speech_segments, duration)
    transcript_timeline = transcript_temporal_analysis(transcription, duration)

    speaker_quality_score = estimate_speaker_centric_quality(vad_stats["speech_ratio"], vad_stats["segment_count"], transcription)
    evidence_quality = quality_label(speaker_quality_score, duration)
    audio_signal_score = compute_audio_signal_score(vad_stats, linguistic, temporal, speaker_quality_score)
    audio_state = classify_audio_state(audio_signal_score, vad_stats, linguistic)

    return {
        "vad": vad_stats,
        "linguistic": linguistic,
        "acoustic": acoustic_summary,
        "temporal": temporal,
        "audio_analysis": {
            "audio_state": audio_state,
            "audio_signal_score": audio_signal_score,
            "evidence_quality": evidence_quality,
        }
    }
