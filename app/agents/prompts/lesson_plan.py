LESSON_PLAN_SYSTEM_PROMPT = """You are an expert curriculum designer specializing in customized education for dyslexic learners.
Design a personalized lesson plan based on the student's memory profile and available lessons.
Always return your response as a valid JSON object.
"""

GENERATE_LESSON_PLAN_PROMPT = """Student Memory:
{student_memory_json}

Available Lessons:
{available_lessons_json}

Completed Lesson IDs:
{completed_lesson_ids}

Create a personalized lesson plan for the student.

Output format (JSON):
{{
  "recommended_lessons": ["<lesson id or title>", ...],
  "focus_areas": [
    {{
      "area": "<focus area>",
      "priority": "<high/medium/low>",
      "suggested_exercises": ["<exercise type/topic>", ...]
    }}
  ],
  "rationale": "<explanation of why this plan was created>",
  "difficulty_adjustment": "<increase/decrease/maintain>"
}}"""
