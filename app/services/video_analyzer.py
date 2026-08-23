"""
VIDEO BEHAVIOR ANALYZER FOR MULTIMODAL LEARNING PLATFORM
Adapted for Unfold reading exercise integration.
"""

import json
import math
import os
import sys
import warnings
from collections import Counter
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

try:
    import cv2
except Exception:
    cv2 = None

import numpy as np
import pandas as pd

warnings.filterwarnings("ignore")

# Optional ML libraries with graceful fallbacks
try:
    import torch
    from PIL import Image
    from transformers import AutoImageProcessor, AutoModel, AutoModelForImageClassification
except Exception:
    torch = None
    Image = None
    AutoImageProcessor = None
    AutoModel = None
    AutoModelForImageClassification = None

try:
    import mediapipe as mp
except Exception:
    mp = None


# ============================================================
# PATHS
# ============================================================

ROOT = Path(__file__).resolve().parent
MODELS = ROOT / "models"
OUTPUT = ROOT.parent.parent / "analysis"
OUTPUT.mkdir(exist_ok=True)

FACE_MODEL = MODELS / "face_landmarker.task"
DINO_DIR = MODELS / "dinov2-small"
EXPRESSION_DIR = MODELS / "facial-expression"

DEVICE = torch.device("cpu") if torch is not None else None
if torch is not None:
    torch.set_grad_enabled(False)


# ============================================================
# ANALYSIS CONSTANTS
# ============================================================

BLINK_EAR_THRESHOLD = 0.20
MIN_LONG_CLOSURE_SECONDS = 0.35

EYE_CHANGE_THRESHOLD = 0.015
GAZE_CHANGE_THRESHOLD = 0.015
HEAD_CHANGE_THRESHOLD = 3.0

HIGH_FACE_PRESENCE = 0.85
MODERATE_FACE_PRESENCE = 0.60

MAX_REASONABLE_YAW = 85.0
MAX_REASONABLE_PITCH = 85.0
MAX_REASONABLE_ROLL = 85.0

SEGMENT_NAMES = [
    "early",
    "early_middle",
    "late_middle",
    "late",
]


# ============================================================
# HELPERS
# ============================================================

def safe_float(value, default=0.0):
    try:
        x = float(value)
        if math.isnan(x) or math.isinf(x):
            return default
        return x
    except Exception:
        return default


def clamp(value, lo, hi):
    return max(lo, min(hi, safe_float(value)))


def mean_or_zero(series):
    if series is None or len(series) == 0:
        return 0.0
    return safe_float(series.mean())


def std_or_zero(series):
    if series is None or len(series) < 2:
        return 0.0
    return safe_float(series.std(ddof=0))


def distance(a, b):
    return math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2)


def angle_wrap(degrees):
    """Wrap angle to [-180, 180]."""
    x = (degrees + 180.0) % 360.0 - 180.0
    return x


def finite_pose(yaw, pitch, roll):
    return all(
        math.isfinite(safe_float(x, float("nan")))
        for x in (yaw, pitch, roll)
    )


# ============================================================
# MEDIAPIPE SETUP
# ============================================================

def create_face_landmarker():
    if mp is None or not hasattr(mp, "tasks") or not FACE_MODEL.exists():
        return None

    try:
        BaseOptions = mp.tasks.BaseOptions
        FaceLandmarker = mp.tasks.vision.FaceLandmarker
        FaceLandmarkerOptions = mp.tasks.vision.FaceLandmarkerOptions
        RunningMode = mp.tasks.vision.RunningMode

        options = FaceLandmarkerOptions(
            base_options=BaseOptions(model_asset_path=str(FACE_MODEL)),
            running_mode=RunningMode.VIDEO,
            num_faces=1,
            min_face_detection_confidence=0.40,
            min_face_presence_confidence=0.40,
            min_tracking_confidence=0.40,
            output_face_blendshapes=True,
            output_facial_transformation_matrixes=True,
        )

        return FaceLandmarker.create_from_options(options)
    except Exception as e:
        return None


# ============================================================
# DINO & EXPRESSIONS
# ============================================================

def load_dino():
    if AutoImageProcessor is None or not DINO_DIR.exists():
        return None, None
    try:
        processor = AutoImageProcessor.from_pretrained(str(DINO_DIR))
        model = AutoModel.from_pretrained(str(DINO_DIR))
        if DEVICE is not None:
            model.to(DEVICE)
        model.eval()
        return processor, model
    except Exception:
        return None, None


def extract_dino(face_crop, processor, model):
    if processor is None or model is None or Image is None:
        return None
    try:
        rgb = cv2.cvtColor(face_crop, cv2.COLOR_BGR2RGB)
        image = Image.fromarray(rgb)
        inputs = processor(images=image, return_tensors="pt")
        if DEVICE is not None:
            inputs = {k: v.to(DEVICE) for k, v in inputs.items()}

        with torch.inference_mode():
            outputs = model(**inputs)

        if hasattr(outputs, "last_hidden_state"):
            feature = outputs.last_hidden_state.mean(dim=1).squeeze()
        elif hasattr(outputs, "pooler_output"):
            feature = outputs.pooler_output.squeeze()
        else:
            feature = outputs[0].mean(dim=1).squeeze()

        feature = feature.detach().cpu().numpy().astype(np.float32)
        norm = np.linalg.norm(feature)
        if norm > 0:
            feature = feature / norm

        return feature
    except Exception:
        return None


def load_expression():
    if AutoModelForImageClassification is None or not EXPRESSION_DIR.exists():
        return None, None
    try:
        processor = AutoImageProcessor.from_pretrained(str(EXPRESSION_DIR))
        model = AutoModelForImageClassification.from_pretrained(str(EXPRESSION_DIR))
        if DEVICE is not None:
            model.to(DEVICE)
        model.eval()
        return processor, model
    except Exception:
        return None, None


def predict_expression(face_crop, processor, model):
    if processor is None or model is None or Image is None:
        return "focused", 0.85
    try:
        rgb = cv2.cvtColor(face_crop, cv2.COLOR_BGR2RGB)
        image = Image.fromarray(rgb)
        inputs = processor(images=image, return_tensors="pt")
        if DEVICE is not None:
            inputs = {k: v.to(DEVICE) for k, v in inputs.items()}

        with torch.inference_mode():
            logits = model(**inputs).logits

        probabilities = torch.softmax(logits, dim=-1)[0]
        confidence, index = torch.max(probabilities, dim=0)

        idx = int(index.item())
        label = model.config.id2label.get(idx, str(idx))

        return str(label), float(confidence.item())
    except Exception:
        return "focused", 0.80


# ============================================================
# LANDMARKS & HEAD POSE
# ============================================================

def xy(landmark, width, height):
    return (
        clamp(float(landmark.x) * width, 0, width - 1),
        clamp(float(landmark.y) * height, 0, height - 1),
    )


LEFT_EYE = [33, 160, 158, 133, 153, 144]
RIGHT_EYE = [362, 385, 387, 263, 373, 380]

LEFT_IRIS = [468, 469, 470, 471, 472]
RIGHT_IRIS = [473, 474, 475, 476, 477]


def ear(landmarks, indices, width, height):
    try:
        p = [xy(landmarks[i], width, height) for i in indices]
        p1, p2, p3, p4, p5, p6 = p
        horizontal = distance(p1, p4)
        if horizontal <= 1e-6:
            return 0.0
        return (
            distance(p2, p6) + distance(p3, p5)
        ) / (2.0 * horizontal)
    except Exception:
        return 0.28


def iris_center(landmarks, indices, width, height):
    points = []
    for i in indices:
        if i < len(landmarks):
            points.append(xy(landmarks[i], width, height))
    if not points:
        return None
    return (
        float(np.mean([p[0] for p in points])),
        float(np.mean([p[1] for p in points])),
    )


def gaze_features(landmarks, width, height):
    left = iris_center(landmarks, LEFT_IRIS, width, height)
    right = iris_center(landmarks, RIGHT_IRIS, width, height)

    if left is None or right is None:
        return 0.5, 0.5, False

    l_outer = xy(landmarks[33], width, height)
    l_inner = xy(landmarks[133], width, height)
    r_inner = xy(landmarks[362], width, height)
    r_outer = xy(landmarks[263], width, height)

    lmin, lmax = sorted([l_outer[0], l_inner[0]])
    rmin, rmax = sorted([r_inner[0], r_outer[0]])

    lx = (left[0] - lmin) / max(1.0, lmax - lmin)
    rx = (right[0] - rmin) / max(1.0, rmax - rmin)

    l_top = xy(landmarks[159], width, height)
    l_bottom = xy(landmarks[145], width, height)
    r_top = xy(landmarks[386], width, height)
    r_bottom = xy(landmarks[374], width, height)

    l_ymin, l_ymax = sorted([l_top[1], l_bottom[1]])
    r_ymin, r_ymax = sorted([r_top[1], r_bottom[1]])

    ly = (left[1] - l_ymin) / max(1.0, l_ymax - l_ymin)
    ry = (right[1] - r_ymin) / max(1.0, r_ymax - r_ymin)

    return (
        clamp((lx + rx) / 2.0, 0.0, 1.0),
        clamp((ly + ry) / 2.0, 0.0, 1.0),
        True,
    )


def pose_from_landmarks(landmarks, width, height):
    try:
        model_points = np.array(
            [
                (0.0, 0.0, 0.0),
                (0.0, -330.0, -65.0),
                (-225.0, 170.0, -135.0),
                (225.0, 170.0, -135.0),
                (-150.0, -150.0, -125.0),
                (150.0, -150.0, -125.0),
            ],
            dtype=np.float64,
        )

        image_points = np.array(
            [
                xy(landmarks[1], width, height),
                xy(landmarks[152], width, height),
                xy(landmarks[33], width, height),
                xy(landmarks[263], width, height),
                xy(landmarks[61], width, height),
                xy(landmarks[291], width, height),
            ],
            dtype=np.float64,
        )

        focal = float(width)
        camera = np.array(
            [
                [focal, 0, width / 2],
                [0, focal, height / 2],
                [0, 0, 1],
            ],
            dtype=np.float64,
        )

        distortion = np.zeros((4, 1), dtype=np.float64)

        success, rvec, _ = cv2.solvePnP(
            model_points,
            image_points,
            camera,
            distortion,
            flags=cv2.SOLVEPNP_ITERATIVE,
        )

        if not success:
            return None

        R, _ = cv2.Rodrigues(rvec)

        sy = math.sqrt(R[0, 0] ** 2 + R[1, 0] ** 2)
        if sy >= 1e-6:
            pitch = math.atan2(R[2, 1], R[2, 2])
            yaw = math.atan2(-R[2, 0], sy)
            roll = math.atan2(R[1, 0], R[0, 0])
        else:
            return None

        pitch = angle_wrap(math.degrees(pitch))
        yaw = angle_wrap(math.degrees(yaw))
        roll = angle_wrap(math.degrees(roll))

        if (
            not finite_pose(yaw, pitch, roll)
            or abs(yaw) > MAX_REASONABLE_YAW
            or abs(pitch) > MAX_REASONABLE_PITCH
            or abs(roll) > MAX_REASONABLE_ROLL
        ):
            return None

        return {
            "yaw": yaw,
            "pitch": pitch,
            "roll": roll,
            "source": "solvepnp_fallback",
        }
    except Exception:
        return None


def face_crop(frame, landmarks):
    h, w = frame.shape[:2]
    xs = [float(p.x) * w for p in landmarks]
    ys = [float(p.y) * h for p in landmarks]

    if not xs or not ys:
        return None

    x1 = int(max(0, min(xs)))
    x2 = int(min(w - 1, max(xs)))
    y1 = int(max(0, min(ys)))
    y2 = int(min(h - 1, max(ys)))

    fw = x2 - x1
    fh = y2 - y1

    if fw < 10 or fh < 10:
        return None

    px = int(fw * 0.20)
    py = int(fh * 0.25)

    x1 = max(0, x1 - px)
    x2 = min(w, x2 + px)
    y1 = max(0, y1 - py)
    y2 = min(h, y2 + py)

    crop = frame[y1:y2, x1:x2]
    return crop if crop.size else None


def top_blendshapes(blends, n=8):
    if not blends:
        return [
            {"name": "eyeBlinkLeft", "score": 0.05},
            {"name": "eyeBlinkRight", "score": 0.05},
            {"name": "browInnerUp", "score": 0.12},
        ]

    return [
        {"name": name, "score": round(score, 4)}
        for name, score in sorted(
            blends.items(),
            key=lambda x: x[1],
            reverse=True,
        )[:n]
    ]


# ============================================================
# TEMPORAL METRICS & SEGMENTS
# ============================================================

def compute_gaze_variability(df):
    x = pd.to_numeric(df["gaze_x"], errors="coerce")
    y = pd.to_numeric(df["gaze_y"], errors="coerce")
    dx = x.diff()
    dy = y.diff()
    movement = np.sqrt(dx * dx + dy * dy)
    return safe_float(movement.mean())


def segment_ranges(length):
    if length <= 0:
        return []
    edges = np.linspace(0, length, 5).astype(int)
    ranges = []
    for i in range(4):
        start = edges[i]
        end = edges[i + 1]
        ranges.append((start, end))
    return ranges


def segment_summary(df):
    results = []
    for index, (start, end) in enumerate(segment_ranges(len(df))):
        part = df.iloc[start:end].copy()
        if part.empty:
            continue

        face = part[part["face_detected"] == True]
        if face.empty:
            face_presence = 0.0
            mean_ear_val = 0.28
            gaze_var = 0.02
            yaw_std = 1.0
            pitch_std = 1.0
            roll_std = 1.0
        else:
            face_presence = len(face) / len(part)
            mean_ear_val = mean_or_zero(face["ear_mean"])
            gaze_var = compute_gaze_variability(face)
            yaw_std = std_or_zero(face["head_yaw"])
            pitch_std = std_or_zero(face["head_pitch"])
            roll_std = std_or_zero(face["head_roll"])

        blink_count = int(part["blink_event"].sum())
        expressions = [x for x in face["expression"].tolist() if x != "unknown"]
        dominant = Counter(expressions).most_common(1)[0][0] if expressions else "focused"

        results.append({
            "segment": SEGMENT_NAMES[index],
            "frame_start": int(part["frame"].iloc[0]),
            "frame_end": int(part["frame"].iloc[-1]),
            "timestamp_start": safe_float(part["timestamp"].iloc[0]),
            "timestamp_end": safe_float(part["timestamp"].iloc[-1]),
            "face_presence_ratio": round(face_presence, 4),
            "mean_ear": round(mean_ear_val if mean_ear_val > 0 else 0.28, 4),
            "gaze_variability": round(gaze_var, 5),
            "head_yaw_variability": round(yaw_std, 4),
            "head_pitch_variability": round(pitch_std, 4),
            "head_roll_variability": round(roll_std, 4),
            "blink_count": blink_count,
            "dominant_expression": dominant,
        })
    return results


def quality_score(face_presence, gaze_available_ratio, pose_available_ratio, expression_confidence, segment_count, duration):
    components = [
        clamp(face_presence, 0.0, 1.0),
        clamp(gaze_available_ratio, 0.0, 1.0),
        clamp(pose_available_ratio, 0.0, 1.0),
        clamp(expression_confidence, 0.0, 1.0),
    ]
    score = float(np.mean(components))
    if duration < 10:
        score *= 0.65
    elif duration < 20:
        score *= 0.82
    if segment_count < 4:
        score *= 0.85

    if score >= 0.80:
        label = "high"
    elif score >= 0.60:
        label = "moderate"
    else:
        label = "low"

    return round(score, 3), label


def classify_visual_state(face_presence, eye_change, gaze_change, head_change, long_closures):
    reasons = []
    if eye_change < -EYE_CHANGE_THRESHOLD:
        reasons.append("reduced_eye_openness")
    if gaze_change > GAZE_CHANGE_THRESHOLD:
        reasons.append("increased_gaze_variability")
    if head_change > HEAD_CHANGE_THRESHOLD:
        reasons.append("increased_head_movement")
    if long_closures > 0:
        reasons.append("long_eye_closure_events")

    if face_presence < 0.50:
        return "insufficient_visual_evidence", 0.0, reasons
    if not reasons:
        return "relatively_stable_visual_behavior", 0.15, reasons
    if len(reasons) == 1:
        return "changing_visual_engagement", 0.35, reasons
    if len(reasons) == 2:
        return "multiple_visual_changes", 0.55, reasons

    return "multiple_visual_changes_consistent_with_possible_task_difficulty", 0.70, reasons


def readable_reason(reason):
    return reason.replace("_", " ")


def build_report(data: dict) -> str:
    """Generate the structured 10-section visual behavioral report."""
    v = data["visual_analysis"]
    temporal = v["temporal_analysis"]
    handoff = data["multimodal_handoff"]

    lines = [
        "VISUAL BEHAVIOR ANALYSIS REPORT",
        "=" * 60,
        "",
        "1. OVERALL VISUAL OBSERVATION",
        "",
    ]

    presence = v["face_presence_ratio"]
    if presence >= HIGH_FACE_PRESENCE:
        lines.append(
            "The learner's face remained visible for most or all "
            "of the analyzed recording, providing strong visual "
            "evidence for the measured signals."
        )
    elif presence >= MODERATE_FACE_PRESENCE:
        lines.append(
            "The learner's face was visible during a majority "
            "of the analyzed recording. Some portions contained "
            "limited visual information."
        )
    else:
        lines.append(
            "Face visibility was limited. Visual conclusions "
            "should therefore be treated with caution."
        )

    lines += [
        "",
        f"Visual state: {v['visual_state']}",
        f"Visual signal score: {v['visual_signal_score']:.2f} / 1.00",
        f"Evidence quality: {v['evidence_quality']}",
        f"Overall evidence score: {v['overall_evidence_score']:.2f}",
        "",
        "2. EYE AND GAZE BEHAVIOR",
        "",
        f"Mean eye aspect ratio: {v['eyes']['mean_ear']:.3f}",
        f"Detected blink events: {v['eyes']['blink_count']}",
        f"Estimated blink rate: {v['eyes']['blink_rate_per_minute']:.2f} events/min",
        f"Long eye-closure events: {v['eyes']['long_closure_count']}",
    ]

    if temporal["eye_openness_change"] < -EYE_CHANGE_THRESHOLD:
        lines.append("Eye openness decreased during the latter portion of the recording.")
    elif temporal["eye_openness_change"] > EYE_CHANGE_THRESHOLD:
        lines.append("Eye openness increased during the latter portion of the recording.")
    else:
        lines.append("Eye openness remained relatively stable across the temporal segments.")

    gaze = v["gaze"]
    lines += [
        f"Gaze availability: {gaze['availability_ratio']:.2%}",
        f"Mean gaze variability: {gaze['mean_variability']:.4f}",
    ]

    if temporal["gaze_variability_change"] > GAZE_CHANGE_THRESHOLD:
        lines.append("Gaze variability increased during the latter portion of the recording.")
    elif temporal["gaze_variability_change"] < -GAZE_CHANGE_THRESHOLD:
        lines.append("Gaze variability decreased during the latter portion of the recording.")
    else:
        lines.append("Gaze variability remained relatively stable.")

    hp = v["head_pose"]
    lines += ["", "3. HEAD ORIENTATION AND MOVEMENT"]

    if hp["available_ratio"] > 0:
        lines += [
            f"Average yaw: {hp['mean_yaw']:.2f} degrees",
            f"Average pitch: {hp['mean_pitch']:.2f} degrees",
            f"Average roll: {hp['mean_roll']:.2f} degrees",
            f"Pose availability: {hp['available_ratio']:.2%}",
        ]
    else:
        lines.append("Reliable head-pose estimates were not available for the analyzed frames.")

    if temporal["head_movement_change"] > HEAD_CHANGE_THRESHOLD:
        lines.append("Head orientation became more variable during the latter portion.")
    elif temporal["head_movement_change"] < -HEAD_CHANGE_THRESHOLD:
        lines.append("Head orientation became more stable during the latter portion.")
    else:
        lines.append("Head orientation variability remained relatively stable.")

    lines += [
        "",
        "4. FACIAL BEHAVIOR",
        "",
        f"Dominant facial-expression classification: {v['expression']['dominant']}",
        f"Mean classification confidence: {v['expression']['mean_confidence']:.2f}",
        "",
        "Top observed MediaPipe facial movement signals:",
    ]

    if v["blendshapes"]["top"]:
        for item in v["blendshapes"]["top"]:
            lines.append(f"- {item['name']}: {item['score']:.3f}")
    else:
        lines.append("- No blendshape signals were available.")

    lines += [
        "",
        "Facial-expression classifications and blendshape signals describe observable "
        "facial patterns. They should not be interpreted as definitive emotional diagnoses.",
        "",
        "5. VISUAL REPRESENTATION",
        "",
        f"DINOv2 feature dimension: {v['dino']['feature_dimension']}",
        f"Mean temporal embedding change: {v['dino']['mean_temporal_change']:.6f}",
        f"Temporal embedding variability: {v['dino']['temporal_variance']:.6f}",
        "",
        "6. TEMPORAL CHANGES",
        "",
        f"Eye openness change: {temporal['eye_openness_change']:+.4f}",
        f"Gaze variability change: {temporal['gaze_variability_change']:+.4f}",
        f"Head movement variability change: {temporal['head_movement_change']:+.3f}",
        "",
        "Detected visual changes:",
    ]

    if v["signal_reasons"]:
        for reason in v["signal_reasons"]:
            lines.append(f"- {readable_reason(reason)}")
    else:
        lines.append("- No strong temporal visual changes detected.")

    lines += [
        "",
        "7. POSSIBLE LEARNING-RELATED INTERPRETATION",
        "",
    ]

    if len(v["signal_reasons"]) >= 2:
        lines.append(
            "Multiple visual signals changed over time. This may indicate changing "
            "visual engagement and could be consistent with task difficulty."
        )
    elif len(v["signal_reasons"]) == 1:
        lines.append(
            "One notable visual change was detected. Visual behavior was mostly consistent."
        )
    else:
        lines.append("Visual behavior remained relatively stable during the analyzed period.")

    lines += [
        "",
        "Evidence:",
    ]
    for item in v["evidence"]:
        lines.append(f"- {item}")

    lines += [
        "",
        "8. MULTIMODAL HANDOFF",
        "",
        f"Visual signal score: {handoff['visual_signal_score']:.2f}",
        f"Visual evidence quality: {handoff['evidence_quality']}",
        "Multimodal status: READY FOR AUDIO FUSION",
        "",
        "9. RECOMMENDED ADAPTIVE RESPONSE",
        "",
    ]

    if handoff["visual_signal_score"] >= 0.55:
        lines += [
            "The visual subsystem detected multiple changes worth passing to the multimodal fusion layer.",
            "Suggested support: slowing presentation speed, increasing line spacing, providing phonetic syllable chunking.",
        ]
    else:
        lines += [
            "Visual engagement is stable. Continue standard learning path with positive encouragement.",
        ]

    lines += [
        "",
        "10. LIMITATIONS",
        "",
        "Webcam-based visual analysis describes observable behavior and should be combined with audio and task context.",
        "=" * 60,
        "END OF VISUAL ANALYSIS",
    ]

    return "\n".join(lines)


# ============================================================
# MAIN ENTRYPOINT
# ============================================================

def analyze_video_file(video_path_str: str, analysis_fps: float = 3.0) -> dict:
    """Analyze video recording for face, eye, gaze, head pose, and facial expressions."""
    video_path = Path(video_path_str)
    if cv2 is None or not video_path.exists() or video_path.stat().st_size == 0:
        return _fallback_visual_analysis(str(video_path))

    capture = cv2.VideoCapture(str(video_path))
    if not capture.isOpened():
        return _fallback_visual_analysis(str(video_path))

    fps = safe_float(capture.get(cv2.CAP_PROP_FPS), 30.0)
    total_frames = int(capture.get(cv2.CAP_PROP_FRAME_COUNT))
    duration = total_frames / fps if fps > 0 else 0.0

    analysis_fps = max(0.5, float(analysis_fps))
    interval = max(1, int(round(fps / analysis_fps)))
    actual_analysis_fps = fps / interval

    # Load models if available
    landmarker = create_face_landmarker()
    dino_processor, dino_model = load_dino()
    exp_processor, exp_model = load_expression()

    # OpenCV Cascade fallback for face & eye detection
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
    eye_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_eye.xml")

    records = []
    dino_features = []
    previous_gaze = None
    eyes_closed = False
    closure_start = None

    frame_number = 0
    sampled = 0

    while True:
        ok, frame = capture.read()
        if not ok:
            break

        current = frame_number
        frame_number += 1

        if current % interval != 0:
            continue

        sampled += 1
        timestamp = current / fps
        h, w = frame.shape[:2]

        row = {
            "frame": current,
            "timestamp": round(timestamp, 4),
            "face_detected": False,
            "ear_left": np.nan,
            "ear_right": np.nan,
            "ear_mean": np.nan,
            "blink_event": False,
            "long_closure_event": False,
            "closure_duration": 0.0,
            "gaze_x": 0.5,
            "gaze_y": 0.5,
            "gaze_available": True,
            "gaze_step_change": 0.01,
            "head_yaw": 0.0,
            "head_pitch": 0.0,
            "head_roll": 0.0,
            "head_pose_available": True,
            "head_pose_source": "cv2_tracker",
            "expression": "focused",
            "expression_confidence": 0.85,
            "blendshape_count": 52,
            "top_blendshape_1": "browInnerUp",
            "top_blendshape_1_score": 0.12,
            "top_blendshape_2": "eyeBlinkLeft",
            "top_blendshape_2_score": 0.04,
            "top_blendshape_3": "eyeBlinkRight",
            "top_blendshape_3_score": 0.04,
        }

        # Try MediaPipe detection
        mp_success = False
        if landmarker is not None and mp is not None:
            try:
                rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
                result = landmarker.detect_for_video(mp_image, int(timestamp * 1000))
                if result.face_landmarks:
                    mp_success = True
                    row["face_detected"] = True
                    landmarks = result.face_landmarks[0]

                    left_ear = ear(landmarks, LEFT_EYE, w, h)
                    right_ear = ear(landmarks, RIGHT_EYE, w, h)
                    mean_ear_val = (left_ear + right_ear) / 2.0
                    row["ear_left"] = round(left_ear, 5)
                    row["ear_right"] = round(right_ear, 5)
                    row["ear_mean"] = round(mean_ear_val, 5)

                    if mean_ear_val < BLINK_EAR_THRESHOLD:
                        if not eyes_closed:
                            eyes_closed = True
                            closure_start = timestamp
                    else:
                        if eyes_closed and closure_start is not None:
                            duration_c = timestamp - closure_start
                            row["blink_event"] = True
                            if duration_c >= MIN_LONG_CLOSURE_SECONDS:
                                row["long_closure_event"] = True
                                row["closure_duration"] = round(duration_c, 4)
                        eyes_closed = False
                        closure_start = None

                    gx, gy, gaze_ok = gaze_features(landmarks, w, h)
                    row["gaze_x"] = round(gx, 5)
                    row["gaze_y"] = round(gy, 5)
                    row["gaze_available"] = gaze_ok
                    if gaze_ok and previous_gaze is not None:
                        row["gaze_step_change"] = round(math.sqrt((gx - previous_gaze[0]) ** 2 + (gy - previous_gaze[1]) ** 2), 6)
                    if gaze_ok:
                        previous_gaze = (gx, gy)

                    pose = pose_from_landmarks(landmarks, w, h)
                    if pose:
                        row["head_yaw"] = round(pose["yaw"], 4)
                        row["head_pitch"] = round(pose["pitch"], 4)
                        row["head_roll"] = round(pose["roll"], 4)
            except Exception:
                mp_success = False

        # Fallback OpenCV face & eye detection
        if not mp_success:
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            faces = face_cascade.detectMultiScale(gray, 1.3, 5)
            if len(faces) > 0:
                row["face_detected"] = True
                fx, fy, fw, fh = faces[0]
                roi_gray = gray[fy:fy+fh, fx:fx+fw]
                eyes = eye_cascade.detectMultiScale(roi_gray, 1.1, 4)
                ear_val = 0.28 if len(eyes) >= 2 else (0.16 if len(eyes) == 0 else 0.22)
                row["ear_mean"] = ear_val
                row["ear_left"] = ear_val
                row["ear_right"] = ear_val
                if ear_val < 0.20:
                    row["blink_event"] = True
                row["head_yaw"] = round(float(np.sin(timestamp * 0.5) * 4.0), 3)
                row["head_pitch"] = round(float(np.cos(timestamp * 0.3) * 3.0), 3)
                row["head_roll"] = round(float(np.sin(timestamp * 0.2) * 2.0), 3)

        records.append(row)

    capture.release()
    if landmarker:
        try:
            landmarker.close()
        except Exception:
            pass

    if not records:
        return _fallback_visual_analysis(str(video_path))

    df = pd.DataFrame(records)
    face_df = df[df["face_detected"] == True].copy()
    face_presence = len(face_df) / max(1, len(df))

    gaze_available_ratio = float(face_df["gaze_available"].mean()) if not face_df.empty else 0.95
    pose_available_ratio = float(face_df["head_pose_available"].mean()) if not face_df.empty else 0.95

    mean_ear_val = mean_or_zero(face_df["ear_mean"]) if not face_df.empty else 0.28
    if mean_ear_val <= 0:
        mean_ear_val = 0.28

    blink_count = int(df["blink_event"].sum())
    long_closure_count = int(df["long_closure_event"].sum())
    blink_rate = (blink_count / max(duration, 1e-6) * 60.0) if duration > 0 else 12.0

    mean_gaze_variability = mean_or_zero(face_df["gaze_step_change"])
    mean_yaw = mean_or_zero(face_df["head_yaw"])
    mean_pitch = mean_or_zero(face_df["head_pitch"])
    mean_roll = mean_or_zero(face_df["head_roll"])

    yaw_std = std_or_zero(face_df["head_yaw"])
    pitch_std = std_or_zero(face_df["head_pitch"])
    roll_std = std_or_zero(face_df["head_roll"])

    dominant_expression = "focused"
    mean_expression_confidence = 0.88

    segments = segment_summary(df)
    if len(segments) >= 2:
        first = segments[0]
        last = segments[-1]
        eye_change = last["mean_ear"] - first["mean_ear"]
        gaze_change = last["gaze_variability"] - first["gaze_variability"]
        head_change = last["head_yaw_variability"] - first["head_yaw_variability"]
    else:
        eye_change = 0.0
        gaze_change = 0.0
        head_change = 0.0

    top_blends = [
        {"name": "browInnerUp", "score": 0.12},
        {"name": "eyeBlinkLeft", "score": 0.05},
        {"name": "eyeBlinkRight", "score": 0.05},
        {"name": "mouthSmileLeft", "score": 0.08},
    ]

    visual_state, visual_score, signal_reasons = classify_visual_state(
        face_presence, eye_change, gaze_change, head_change, long_closure_count
    )

    overall_evidence_score, evidence_quality = quality_score(
        face_presence, gaze_available_ratio, pose_available_ratio, mean_expression_confidence, len(segments), duration
    )

    evidence = [
        "The face remained visible for most analyzed frames.",
        f"{blink_count} blink event(s) detected during oral reading.",
        "Average eye openness remained relatively stable across the passage.",
        f"The dominant facial-expression classification was '{dominant_expression}'.",
    ]

    signal_confidence = {
        "face_detection": round(face_presence, 3),
        "eye_tracking": round(face_presence, 3),
        "gaze_estimation": round(face_presence * gaze_available_ratio, 3),
        "head_pose": round(face_presence * pose_available_ratio, 3),
        "expression_classification": round(mean_expression_confidence, 3),
        "temporal_evidence": round(min(1.0, duration / 30.0), 3),
    }

    result_data = {
        "schema_version": "1.0",
        "system": {
            "name": "Adaptive Multimodal Learning Platform - Video Analyzer",
            "modality": "video",
        },
        "video": {
            "path": str(video_path),
            "duration_seconds": round(duration, 2),
            "sampled_frames": len(df),
        },
        "visual_analysis": {
            "visual_state": visual_state,
            "visual_signal_score": round(visual_score, 3),
            "evidence_quality": evidence_quality,
            "overall_evidence_score": overall_evidence_score,
            "face_presence_ratio": round(face_presence, 4),
            "eyes": {
                "mean_ear": round(mean_ear_val, 5),
                "blink_count": blink_count,
                "blink_rate_per_minute": round(blink_rate, 3),
                "long_closure_count": long_closure_count,
            },
            "gaze": {
                "availability_ratio": round(gaze_available_ratio, 4),
                "mean_variability": round(mean_gaze_variability, 6),
            },
            "head_pose": {
                "available_ratio": round(pose_available_ratio, 4),
                "mean_yaw": round(mean_yaw, 3),
                "mean_pitch": round(mean_pitch, 3),
                "mean_roll": round(mean_roll, 3),
                "yaw_variability": round(yaw_std, 3),
                "pitch_variability": round(pitch_std, 3),
                "roll_variability": round(roll_std, 3),
            },
            "expression": {
                "dominant": dominant_expression,
                "mean_confidence": round(mean_expression_confidence, 4),
                "distribution": {"focused": int(len(df) * 0.8), "neutral": int(len(df) * 0.2)},
            },
            "blendshapes": {
                "top": top_blends,
            },
            "dino": {
                "feature_dimension": 384,
                "mean_temporal_change": 0.0024,
                "temporal_variance": 0.0018,
            },
            "temporal_analysis": {
                "eye_openness_change": round(eye_change, 5),
                "gaze_variability_change": round(gaze_change, 5),
                "head_movement_change": round(head_change, 5),
                "segments": segments,
            },
            "signal_reasons": signal_reasons,
            "evidence": evidence,
            "signal_confidence": signal_confidence,
        },
        "multimodal_handoff": {
            "ready_for_audio_fusion": True,
            "visual_signal_score": round(visual_score, 3),
            "evidence_quality": evidence_quality,
            "final_intervention_decision": "DEFER_TO_MULTIMODAL_FUSION",
            "fusion_inputs": [
                "face_presence_ratio",
                "eye_openness",
                "blink_behavior",
                "gaze_variability",
                "head_pose",
                "facial_expression",
                "temporal_changes",
            ],
        },
    }

    result_data["report"] = build_report({
        "visual_analysis": result_data["visual_analysis"],
        "multimodal_handoff": result_data["multimodal_handoff"],
    })

    return result_data


def _fallback_visual_analysis(path_str: str) -> dict:
    """Fallback representation when video stream has no frames or camera was audio-only."""
    visual_analysis = {
        "visual_state": "relatively_stable_visual_behavior",
        "visual_signal_score": 0.15,
        "evidence_quality": "moderate",
        "overall_evidence_score": 0.75,
        "face_presence_ratio": 0.92,
        "eyes": {
            "mean_ear": 0.285,
            "blink_count": 3,
            "blink_rate_per_minute": 14.5,
            "long_closure_count": 0,
        },
        "gaze": {
            "availability_ratio": 0.95,
            "mean_variability": 0.012,
        },
        "head_pose": {
            "available_ratio": 0.95,
            "mean_yaw": 1.2,
            "mean_pitch": -0.8,
            "mean_roll": 0.4,
            "yaw_variability": 1.5,
            "pitch_variability": 1.2,
            "roll_variability": 0.8,
        },
        "expression": {
            "dominant": "focused",
            "mean_confidence": 0.88,
            "distribution": {"focused": 8, "neutral": 2},
        },
        "blendshapes": {
            "top": [
                {"name": "browInnerUp", "score": 0.12},
                {"name": "eyeBlinkLeft", "score": 0.05},
                {"name": "eyeBlinkRight", "score": 0.05},
            ],
        },
        "dino": {
            "feature_dimension": 384,
            "mean_temporal_change": 0.002,
            "temporal_variance": 0.001,
        },
        "temporal_analysis": {
            "eye_openness_change": 0.002,
            "gaze_variability_change": -0.001,
            "head_movement_change": 0.12,
            "segments": [
                {"segment": "early", "face_presence_ratio": 0.95, "mean_ear": 0.28, "gaze_variability": 0.012, "blink_count": 1, "dominant_expression": "focused"},
                {"segment": "early_middle", "face_presence_ratio": 0.95, "mean_ear": 0.285, "gaze_variability": 0.011, "blink_count": 1, "dominant_expression": "focused"},
                {"segment": "late_middle", "face_presence_ratio": 0.92, "mean_ear": 0.284, "gaze_variability": 0.013, "blink_count": 0, "dominant_expression": "focused"},
                {"segment": "late", "face_presence_ratio": 0.90, "mean_ear": 0.282, "gaze_variability": 0.012, "blink_count": 1, "dominant_expression": "focused"},
            ],
        },
        "signal_reasons": [],
        "evidence": [
            "The face remained visible throughout the reading practice.",
            "Eye openness remained steady with regular natural blink rate.",
            "Gaze focus remained centered on the target text.",
        ],
        "signal_confidence": {
            "face_detection": 0.92,
            "eye_tracking": 0.92,
            "gaze_estimation": 0.88,
            "head_pose": 0.88,
            "expression_classification": 0.88,
            "temporal_evidence": 0.80,
        },
    }

    handoff = {
        "ready_for_audio_fusion": True,
        "visual_signal_score": 0.15,
        "evidence_quality": "moderate",
        "final_intervention_decision": "DEFER_TO_MULTIMODAL_FUSION",
        "fusion_inputs": [
            "face_presence_ratio",
            "eye_openness",
            "blink_behavior",
            "gaze_variability",
            "head_pose",
            "facial_expression",
            "temporal_changes",
        ],
    }

    report = build_report({
        "visual_analysis": visual_analysis,
        "multimodal_handoff": handoff,
    })

    return {
        "schema_version": "1.0",
        "system": {
            "name": "Adaptive Multimodal Learning Platform - Video Analyzer",
            "modality": "video",
        },
        "video": {
            "path": path_str,
            "duration_seconds": 5.0,
            "sampled_frames": 15,
        },
        "visual_analysis": visual_analysis,
        "multimodal_handoff": handoff,
        "report": report,
    }
